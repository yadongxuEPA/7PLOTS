function heatmapLegend(el, color) {
  const margin = {
    top: 20,
    right: 12,
    bottom: 20,
    left: 4,
  };
  const width = 320;
  const height = 16;
  const totalWidth = width + margin.left + margin.right;
  const totalHeight = height + margin.top + margin.bottom;

  const container = d3
    .select(el)
    .append("div")
    .style("position", "relative")
    .style("display", "inline-block")
    .style("text-align", "center");

  const svg = container
    .append("svg")
    .style("display", "block")
    .attr("width", totalWidth)
    .attr("height", totalHeight);
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  g.append("text")
    .attr("y", -9)
    .text("Number of Pearson correlation coefficients");
  const tickScale = d3.scaleLinear().domain(color.domain()).range([0, width]);

  const ticks = tickScale.ticks(width / 40);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(tickScale).tickValues(ticks))
    .call((g) => g.select(".domain").remove());

  const swatch = g
    .append("g")
    .selectAll(".swatch")
    .data(d3.pairs(ticks))
    .join("rect")
    .attr("class", "swatch")
    .attr("x", (d) => tickScale(d[0]))
    .attr("width", (d) => tickScale(d[1]) - tickScale(d[0]))
    .attr("y", 0)
    .attr("height", height);

  dispatch.on("colorchange.heatmap-legend", updateColor);

  function updateColor() {
    swatch.attr("fill", (d) => color(d[0]));
  }
}
