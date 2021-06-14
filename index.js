const axios = require("axios");
const open = require("open");

const johnsonDoctorIds = [
  //   "4626164",
  "4955521",
  "4351848",
  "4914793",
  "4386537",
  "4529791",
  //   "4387297",
  "4407490",
  "4781098",
  "5099992",
  "4463022",
  "4351851",
  "4879200",
  "4860427",
  "4385798",
  "4948214",
  "4407502",
  "4907911",
  "4407513",
  "4596648",
  "4407478",
  "4954667",
  "5110081",
  "5005717",
  "5026194",
];

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

const run = async () => {
  const doctorRequests = johnsonDoctorIds.map(fetchDoctorInfo);

  await Promise.all(doctorRequests).then((data) => {
    const availableDoctors = data.filter(hasSlot);

    availableDoctors.forEach((doctor) => {
      const url = doctor?.search_result?.url;

      if (url && !cooldowns.includes(url)) {
        open(`https://www.doctolib.de${url}`);
        cooldowns.push(url);

        setTimeout(() => {
          const index = cooldowns.indexOf(url);
          if (index > -1) {
            cooldowns.splice(index, 1);
          }
        }, 60000);
      }
    });
  });
};

setInterval(async () => {
  console.log("Checking!");
  await run();
}, 1000);
