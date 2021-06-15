const axios = require("axios");
const open = require("open");
const cheerio = require("cheerio");
const _ = require("lodash");

const blacklistedNames = ["KANTPRAXIS"];

const getDoctorIdsForPage = async (page) => {
  let response = {};
  try {
    let url =
      page === 1
        ? "https://www.doctolib.de/impfung-covid-19-corona/berlin?ref_visit_motive_ids%5B%5D=7978"
        : `https://www.doctolib.de/impfung-covid-19-corona/berlin?page=${page}&ref_visit_motive_ids%5B%5D=7978`;
    response = await axios.get(url);

    const $ = cheerio.load(response?.data);

    const ids = [];
    $(".dl-search-result").each((i, elem) => {
      const [, , id] = elem.attribs.id.split("-");
      ids.push(id);
    });

    return ids;
  } catch (err) {
    console.log(`ignored error for doctor search with page ${page}`);
    return [];
  }
};

const getAllDoctorIds = async () => {
  const pages = [1, 2, 3, 4];

  const doctorIdsRequests = pages.map(getDoctorIdsForPage);

  return Promise.all(doctorIdsRequests).then((data) => _.uniq(_.flatten(data)));
};

const buildDoctorUrl = (doctorId) =>
  `https://www.doctolib.de/search_results/${doctorId}.json?limit=7&insurance_sector=public&ref_visit_motive_ids%5B%5D=7978&speciality_id=5593&search_result_format=json`;

const fetchDoctorInfo = async (doctorId) => {
  const doctorUrl = buildDoctorUrl(doctorId);

  let response = {};
  try {
    response = await axios.get(doctorUrl);
  } catch (err) {
    console.log(`ignored error for ${doctorId}`);
  }

  return response?.data;
};

const hasSlot = (doctorObj) =>
  !!doctorObj?.next_slot ||
  doctorObj?.total > 0 ||
  doctorObj?.availabilities?.find((a) => !!a?.slots?.length > 0);

const cooldowns = [];

const run = async (doctorIds) => {
  const doctorRequests = doctorIds.map(fetchDoctorInfo);

  await Promise.all(doctorRequests).then((data) => {
    const availableDoctors = data.filter(hasSlot);

    availableDoctors.forEach((doctor) => {
      const url = doctor?.search_result?.url;

      const isBlacklisted = blacklistedNames.includes(
        doctor?.search_result?.name_with_title
      );

      if (url && !isBlacklisted && !cooldowns.includes(url)) {
        open(`https://www.doctolib.de${url}`);
        cooldowns.push(url);

        setTimeout(() => {
          const index = cooldowns.indexOf(url);
          if (index > -1) {
            cooldowns.splice(index, 1);
          }
        }, 60000 * 2);
      }
    });
  });
};

const init = async () => {
  let allDoctorIds = await getAllDoctorIds();

  setInterval(async () => {
    console.log("Refetching doctor ids!");
    allDoctorIds = await getAllDoctorIds();
  }, 60000);

  setInterval(async () => {
    if (!_.isEmpty(allDoctorIds)) {
      console.log("Checking!");
      await run(allDoctorIds);
    } else {
      console.log("No doctor ids found.");
    }
  }, 2000);
};

init();
