function heatmapChart(el, data, color, tooltip, dispatch) {
  let dFreezed;

  const gridSize = 24;
  const margin = {
    left: 240,
    top: 96,
    right: 8,
    bottom: 16,
  };
  let width, height, totalWidth, totalHeight;

  const x = d3.scaleBand();
  const y = d3.scaleBand();

  const xAxis = (g) =>
    g
      .call(d3.axisTop(x))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .attr("text-anchor", "start")
          .selectAll(".tick text")
          .attr("y", 0)
          .attr("dy", "0.32em")
          .attr("x", 9)
          .attr("transform", "rotate(-90)")
      );
  const yAxis = (g) =>
    g.call(d3.axisLeft(y)).call((g) => g.select(".domain").remove());
  const xyGrid = (g) =>
    g
      .selectAll(".cell-grid")
      .data(d3.cross(x.domain(), y.domain()))
      .join("rect")
      .attr("class", "cell-grid")
      .attr("transform", (d) => `translate(${x(d[0])},${y(d[1])})`)
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("fill", "none")
      .attr("stroke", "currentColor");

  const container = d3.select(el).classed("heatmap-chart", true);
  const svg = container.append("svg");
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const gx = g.append("g").attr("class", "axis x-axis");
  const gy = g.append("g").attr("class", "axis y-axis");
  const frame = g
    .append("rect")
    .attr("class", "heatmap-frame")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("width", width)
    .attr("height", height);
  const gGrid = g.append("g").attr("class", "heatmap-grid");
  const gxy = g.append("g").attr("class", "axis");

  let gridCell = gGrid.selectAll(".heatmap-grid-cell");

  dispatch.on("colorchange.heatmap-chart", updateColor);

  wrangle();

  function wrangle() {
    width = gridSize * data.xs.length;
    height = gridSize * data.ys.length;
    totalWidth = width + margin.left + margin.right;
    totalHeight = height + margin.top + margin.bottom;

    x.domain(data.xs).range([0, width]);
    y.domain(data.ys).range([0, height]);

    render();
  }

  function render() {
    svg.attr("width", totalWidth).attr("height", totalHeight);
    gx.call(xAxis);
    gy.call(yAxis);
    gxy.call(xyGrid);
    gridCell = gridCell
      .data(data, (d) => `${d.x}-${d.y}`)
      .join((enter) =>
        enter
          .append("rect")
          .attr("class", "heatmap-grid-cell")
          .attr("width", gridSize)
          .attr("height", gridSize)
          .on("mouseenter", function (event, d) {
            if (dFreezed) return;
            d3.select(this).raise();
            hoverHighlight(d);
            renderTooltip(d);
          })
          .on("mouseleave", () => {
            if (dFreezed) return;
            resetHoverHighlight();
            tooltip.hide();
          })
          .on("mousemove", (event) => {
            if (dFreezed) return;
            tooltip.move(event);
          })
          .on("click", function (event, d) {
            if (!dFreezed) {
              // No freezed cell
              dFreezed = d;
              dispatch.call("tableupdate", null, d);
              d3.select(this).classed("is-freezed", true);
            } else if (dFreezed === d) {
              // Freezed cell is clicked cell
              dFreezed = null;
              dispatch.call("tableupdate", null, null);
              resetHoverHighlight();
              tooltip.hide();
              d3.select(this).classed("is-freezed", false);
            } else {
              // Freezed cell isn't clicked cell
              dFreezed = d;
              dispatch.call("tableupdate", null, d);
              d3.select(this).raise();
              gridCell.classed("is-freezed", (e) => e === d);
              hoverHighlight(d);
              renderTooltip(d);
              tooltip.move(event);
            }
          })
      )
      .attr("fill", (d) => color(d.value))
      .attr("transform", (d) => `translate(${x(d.x)},${y(d.y)})`);
  }

  function updateColor() {
    gridCell.attr("fill", (d) => color(d.value));
  }

  // RE-CLICK THE SAME CELL TO RETURN TO FULL HEATMAP
  function renderTooltip(d) {
    const content = `
      <div class="content">
        <div>Cause: ${d.x}</div>
        <div>Effect: ${d.y}</div>
        <div>Number of Pearson correlation coefficients: ${d3.format(",")(
          d.value
        )}</div>
        <div>Number of papers: ${d3.format(",")(d.papers.length)}</div>
        <div><b> <i>Click cell to view/hide papers and summary values.</i> </b> </div>
      </div>
      `;
    tooltip.show(content);
  }

  function hoverHighlight(d) {
    gridCell
      .transition()
      .duration(150)
      .attr("opacity", (e) => (e === d ? 1 : 0.1));
    gx.selectAll(".tick").attr("font-weight", (e) =>
      e === d.x ? "bold" : null
    );
    gy.selectAll(".tick").attr("font-weight", (e) =>
      e === d.y ? "bold" : null
    );
  }

  function resetHoverHighlight() {
    gridCell.transition().duration(150).attr("opacity", 1);
    gx.selectAll(".tick").attr("font-weight", null);
    gy.selectAll(".tick").attr("font-weight", null);
  }

  function updateData(newData) {
    data = newData;
    wrangle();
  }

  return {
    updateData,
  };
}
