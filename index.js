const axios = require("axios");
const open = require("open");

const johnsonDoctorIds = [
  "4955521",
  "4351848",
  "4914793",
  "4386537",
  "4529791",
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
  "5325685",
  "5723020",
  "5305526",
  "5250586",
  "5421757",
  "5421757",
  "5271914",
  "5716216",
  "5628659",
  "5325709",
  "5588597",
  "5246044",
  "5916176",
  "5246041",
  "5325720",
  "5478129",
  "5288156",
  "5455908",
  "5431849",
  "5410490",
  "5304027",
  "5304766",
  "5865346",
  "5484915",
  "5325697",
  "5880879",
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
