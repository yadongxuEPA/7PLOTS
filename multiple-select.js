class MultipleSelect {
  constructor({ el, options, selectedOptions, dispatch }) {
    this.el = el;
    this.options = options;
    this.selectedOptions = selectedOptions;
    this.dispatch = dispatch;
    this.init();
  }

  init() {
    const vis = this;
    vis.select = d3
      .select(vis.el)
      .attr("size", vis.options.length + 1)
      .on("change", function (event) {
        const selectAll = !this.value;
        if (selectAll) {
          vis.selectedOptions = vis.options.slice();
        } else {
          vis.selectedOptions = Array.from(this.selectedOptions)
            .filter((d) => d.value)
            .map((d) => d.value);
        }
        vis.dispatch.call("change", null, vis.selectedOptions);
        vis.updateVis();
      });
    vis.option = vis.select
      .selectAll("option")
      .data(["Select All", ...vis.options])
      .join("option")
      .attr("value", (d, i) => (i > 0 ? d : ""))
      .attr("selected", (d) => (vis.selectedOptions.includes(d) ? "" : null))
      .text((d) => d);
    vis.selectAllEl = vis.option.filter((d, i) => i === 0).node();
    vis.valueOptionsEls = vis.option.filter((d, i) => i > 0).nodes();
    vis.updateVis();
  }

  updateVis() {
    const vis = this;
    const allSelected = vis.selectedOptions.length === vis.options.length;
    vis.selectAllEl.selected = false;
    if (allSelected) {
      vis.selectAllEl.disabled = true;
      vis.valueOptionsEls.forEach((optionEl) => {
        optionEl.selected = true;
      });
    } else {
      vis.selectAllEl.disabled = false;
      vis.valueOptionsEls.forEach((optionEl) => {
        optionEl.selected = vis.selectedOptions.includes(optionEl.value);
      });
    }
  }
}
