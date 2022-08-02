class CountryStateSelect {
  constructor({
    el,
    countries,
    states,
    selectedCountries,
    selectedStates,
    dispatch,
  }) {
    this.el = el;
    this.countries = countries;
    this.states = states;
    this.selectedCountries = selectedCountries;
    this.selectedStates = selectedStates;
    this.dispatch = dispatch;
    this.init();
  }

  init() {
    const vis = this;
    vis.container = d3.select(vis.el).html(/*html*/ `
        <div class="columns has-text-left">
          <div class="column is-half">
            <div class="field country-select-field">
              <label class="label is-small">Select Countries</label>
              <div class="control is-expanded">
                <div class="select is-multiple is-small is-fullwidth">
                  <select multiple class="country-select">
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-half">
            <div class="field state-select-field">
              <label class="label is-small">Select States</label>
              <div class="control is-expanded">
                <div class="select is-multiple is-small is-fullwidth">
                  <select multiple class="state-select">
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);

    vis.stateSelectField = vis.container.select(".state-select-field");

    vis.countrySelectDispatch = d3
      .dispatch("change")
      .on("change", (countries) => {
        vis.selectedCountries = countries;
        if (vis.selectedCountries.includes("United States")) {
          vis.stateSelectField.style("display", null);
          vis.selectedStates = vis.states.slice();
        } else {
          vis.stateSelectField.style("display", "none");
          vis.selectedStates = [];
        }
        vis.dispatch.call("countrystatechange", this, {
          countries: vis.selectedCountries,
          states: vis.selectedStates,
        });
      });
    vis.countrySelect = new MultipleSelect({
      el: vis.container.select(".country-select").node(),
      options: vis.countries,
      selectedOptions: vis.selectedCountries,
      dispatch: vis.countrySelectDispatch,
    });

    vis.stateSelectDispatch = d3.dispatch("change").on("change", (states) => {
      vis.selectedStates = states;
      vis.dispatch.call("countrystatechange", this, {
        countries: vis.selectedCountries,
        states: vis.selectedStates,
      });
    });
    vis.stateSelect = new MultipleSelect({
      el: vis.container.select(".state-select").node(),
      options: vis.states,
      selectedOptions: vis.selectedStates,
      dispatch: vis.stateSelectDispatch,
    });
  }
}
