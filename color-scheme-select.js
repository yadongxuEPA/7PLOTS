function colorSchemeSelect(el, color, dispatch) {
  const colorSchemes = [
    { name: "Blues", colors: d3.schemeBlues[9].slice(1) },
    { name: "Greens", colors: d3.schemeGreens[9].slice(1) },
    { name: "Oranges", colors: d3.schemeOranges[9].slice(1) },
    { name: "Reds", colors: d3.schemeReds[9].slice(1) },
  ];

  d3.select(el)
    .on("change", function () {
      const colorScheme = colorSchemes.find((d) => d.name === this.value);
      color.range(colorScheme.colors);
      dispatch.call("colorchange");
    })
    .selectAll("option")
    .data(colorSchemes)
    .join("option")
    .attr("value", (d) => d.name)
    .text((d) => d.name);
}
