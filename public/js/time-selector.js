(function() {
  var timeSelector = $('#time-selector'),
    since = timeSelector.data('since');

  function addTimeSelectorOption(val, label) {
    var option = $('<option>');
    option.text(label);
    option.val(val);
    if(val == since) {
      option.prop('selected', true);
    }
    timeSelector.append(option);
  }

  if (timeSelector.length) {
    addTimeSelectorOption('today', 'Today');
    addTimeSelectorOption('week', 'This Week');
    addTimeSelectorOption('month', 'This Month');
    addTimeSelectorOption('all', 'All Time');

    timeSelector.change(function() {
      var loc = window.location;
      loc.href = loc.origin + loc.pathname + '?since=' + this.value;
    });

  }
})();