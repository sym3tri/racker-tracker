var datejs = require('datejs');

module.exports = {

  pad: function(s) {
    return s < 10 ? '0' + s : s;
  },

  parseDate: function(date) {
    var d,
      ts = parseInt(date, 10);

    if (date instanceof Date) {
      d = date;
    } else if (isNaN(ts)) {
      d = Date.parse(date);
    } else {
      console.log('ts: ' + ts);
      d = new Date(ts);
    }

    return d.toString('yyyy-MM-dd');
  }

};
