var timeSelector = $('#time-selector');
function addTimeSelectorOption(val, label) {
  timeSelector.append('<option value="' + val +'">' + label +'</option>');
}

if (timeSelector.length) {
  var yesterday = Date.today().add(-1).days(),
      pastWeek = Date.today().add(-7).days(),
      pastMonth = Date.today().add(-1).months();

  addTimeSelectorOption(yesterday.getTime(), 'Today');
  addTimeSelectorOption(pastWeek.getTime(), 'Past Week');
  addTimeSelectorOption(pastMonth.getTime(), 'Past 30 days');
  addTimeSelectorOption(0, 'All Time');

  timeSelector.change(function() {
    var loc = window.location;
    loc.href = loc.origin + loc.pathname + '?since=' + this.value;
  });

}
