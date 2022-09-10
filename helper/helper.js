exports.GenerateTracking = (pr = "TR") => {
  for (let i = 0; i < 10; i++) pr += ~~(Math.random() * 10);
  return pr;
};

var fs = require("fs");
var path = require("path");
exports.GET_IMAGE_PATH = async function (image) {
  try {
    const match = ["image/png", "image/jpeg", "image/jpg"];
    let r = Math.random().toString(36).substring(7);

    if (match.indexOf(image.type) === -1) {
      throw new Error("invalid image type");
    }
    pathName = `uploads/images/${
      r + "" + image.originalFilename.replace(/\s/g, "")
    }`;
    let stream = await fs.readFileSync(image.path);
    await fs.writeFileSync(path.join(__dirname, `../${pathName}`), stream);

    console.log("ImageURl", pathName);
    // clean it and return

    return pathName;
  } catch (error) {
    throw error;
  }
};




const moment = require("moment");

exports.generateTimeSlots = (starttime, endtime, interval) => {
    let timeslots = [];
    let count = 0;
    while (starttime.isBefore(endtime)) {
      // console.log(timeslots)
      // console.log(true)
      if (count == 0) {

        timeslots.push({startTime: moment(starttime).format("hh:mm a"),endTime:  moment(starttime).add(interval, "minutes").format("hh:mm a"),available:true});

        count += 1;
      } else {
        // console.log()
        let time = timeslots[timeslots.length-1].endTime
        // console.log(time)
          timeslots.push({startTime:timeslots[timeslots.length-1].endTime,endTime:  moment(starttime).add(interval*count, "minutes").format("hh:mm a"),available:true})
      }
      starttime = moment(starttime).add(interval, "minutes");

    }
    return timeslots;
  }
