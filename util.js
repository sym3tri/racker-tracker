'use strict';

require('datejs');

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

console.log('d:', d);
    return d.toString('yyyy-MM-dd');
  },

  toSqlDate: function(date) {
    return date.getUTCFullYear() + '-' +
      this.pad(date.getUTCMonth()+1) + '-' +
      this.pad(date.getUTCDate());
  }

};
