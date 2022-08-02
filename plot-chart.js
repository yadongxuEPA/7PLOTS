function plotChart(elFocus, elContext, elLegend, tooltip) {
  let selectedXDomain,
    labelColumn,
    valueColumns,
    selectedValueColumns,
    data,
    labels;

  const dimension = {
    margin: {
      top: 20,
      right: 24,
      get bottom() {
        return 32 + this.labelSize;
      },
      focusBottom: 24,
      left: 80,
      labelSize: 0,
    },
    width: 0,
    get height() {
      return 360 + this.margin.top + this.margin.bottom;
    },
    focusHeight: 112,
    r: 4,
  };

  const color = d3.scaleOrdinal().range(d3.schemeTableau10);
  const x = d3.scaleLinear();
  const y = d3.scaleLinear();
  const xContext = x.copy();
  const yContext = y
    .copy()
    .range([dimension.focusHeight - dimension.margin.focusBottom, 4]);

  const legend = renderLegend();
  const focus = renderFocus();
  const context = renderContext();
  resize();

  window.addEventListener("resize", resize);

  function renderLegend() {
    const legend = d3.select(elLegend).classed("legend", true);
    function update() {
      const item = legend
        .selectAll(".legend-item")
        .data(color.domain())
        .join((enter) =>
          enter
            .append("label")
            .attr("class", "legend-item")
            .call((enter) =>
              enter
                .append("input")
                .attr("type", "checkbox")
                .attr("class", "legend-input")
                .on("change", toggle)
            )
            .call((enter) => enter.append("div").attr("class", "legend-swatch"))
            .call((enter) => enter.append("div").attr("class", "legend-label"))
        );
      item.select(".legend-input").each(function () {
        this.checked = true;
      });
      item.select(".legend-swatch").style("color", (d) => color(d));
      item.select(".legend-label").text((d) => d);
    }

    function toggle(event, d) {
      if (event.target.checked) {
        selectedValueColumns.add(d);
      } else {
        selectedValueColumns.delete(d);
      }
      focus.updateSeries();
      context.updateSeries();
    }

    return {
      update,
    };
  }

  function renderFocus() {
    let gd;
    const clipPadding = 8;

    const svg = d3
      .select(elFocus)
      .append("svg")
      .attr("class", "focus")
      .attr("viewBox", [0, 0, dimension.width, dimension.height])
      .attr("display", "block");

    const zoom = d3.zoom().scaleExtent([1, Infinity]).on("zoom", zoomed);

    const line = d3
      .line()
      .defined((d) => !(d[1] == null))
      .x((d) => x(d[0]))
      .y((d) => y(d[1]));

    const clipId = "focus-chart-clip";
    const clipRect = svg
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", dimension.margin.left - clipPadding)
      .attr("y", 0)
      .attr("height", dimension.height);

    const xAxis = (g) =>
      g
        .call(
          d3
            .axisBottom(x)
            .tickValues(d3.range(1, data.length + 1))
            .tickFormat(d3.format("d"))
            .tickSizeOuter(0)
        )
        .call((g) =>
          g.selectAll(".tick").each(function (d) {
            const labelText = data[d - 1][labelColumn];
            const tick = d3.select(this);
            let label = tick.select(".focus-label");
            if (label.empty()) {
              label = tick
                .append("text")
                .attr("class", "focus-label")
                .attr("fill", "currentColor")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("dy", "0.32em")
                .attr("x", -24);
            }
            label.text(labelText);
          })
        );
    const yAxis = (g) =>
      g
        .call(
          d3
            .axisLeft(y)
            .ticks(8)
            .tickPadding(8 + dimension.r)
            .tickSizeInner(
              -(
                dimension.width -
                dimension.margin.left -
                dimension.margin.right
              )
            )
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll(".axis-title")
            .data(["Y Axis Label (unit)"])
            .join("text")
            .attr("class", "axis-title")
            .attr("fill", "currentColor")
            .attr("text-anchor", "middle")
            .attr("dy", 0)
            .attr(
              "transform",
              `translate(-${dimension.margin.left - 20},${
                (dimension.height + dimension.margin.top) / 2
              })rotate(-90)
              `
            )
            .text((d) => d)
        );

    const zoomRect = svg
      .append("rect")
      .attr("class", "zoom")
      .attr("fill", "none")
      .style("pointer-events", "all")
      .attr("x", dimension.margin.left)
      .attr("y", dimension.margin.height)
      .attr(
        "height",
        dimension.height - dimension.margin.top - dimension.margin.bottom
      )
      .call(zoom);

    const gy = svg
      .append("g")
      .attr("class", "axis y-axis")
      .attr("transform", `translate(${dimension.margin.left},0)`);

    const g = svg.append("g").attr("clip-path", `url(#${clipId})`);

    const gx = g
      .append("g")
      .attr("class", "axis x-axis")
      .attr(
        "transform",
        `translate(0,${dimension.height - dimension.margin.bottom})`
      );

    function update() {
      svg.attr("viewBox", [0, 0, dimension.width, dimension.height]);

      zoom
        .translateExtent([
          [dimension.margin.left, dimension.margin.top],
          [
            dimension.width - dimension.margin.right,
            dimension.height - dimension.margin.bottom,
          ],
        ])
        .extent([
          [dimension.margin.left, dimension.margin.top],
          [
            dimension.width - dimension.margin.right,
            dimension.height - dimension.margin.bottom,
          ],
        ]);

      clipRect.attr("height", dimension.height);

      gx.attr(
        "transform",
        `translate(0,${dimension.height - dimension.margin.bottom})`
      ).call(xAxis);
      gy.call(yAxis);

      g.selectAll(".focus-path")
        .data(valueColumns)
        .join((enter) =>
          enter
            .append("path")
            .attr("class", "focus-path")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
        )
        .style("display", null)
        .style("color", (column) => color(column))
        .attr("d", (column) => line(data.map((d) => [d.id, d[column]])));

      gd = g
        .selectAll(".focus-item")
        .data(data)
        .join((enter) =>
          enter
            .append("g")
            .attr("class", "focus-item")
            .call((g) => g.append("line").attr("class", "focus-line"))
        )
        .attr("transform", (d) => `translate(${x(d.id)},0)`);
      gd.select(".focus-line").each(function (d) {
        const extent = d3.extent(valueColumns, (column) => d[column]);
        d3.select(this).attr("y1", y(extent[0])).attr("y2", y(extent[1]));
      });
      gd.selectAll(".focus-symbol")
        .data(valueColumns)
        .join((enter) =>
          enter
            .append("circle")
            .attr("class", "focus-symbol")
            .on("mouseenter", function (event, column) {
              const d = d3.select(this.parentNode).datum();
              const content = `
              <p>${column}</p>
              <p>${d[column]}</p>
              `;
              tooltip.show(content, color(column));
            })
            .on("mousemove", tooltip.move)
            .on("mouseleave", tooltip.hide)
        )
        .attr("r", function (column) {
          const d = d3.select(this.parentNode).datum();
          return d[column] == null ? 0 : dimension.r;
        })
        .style("display", null)
        .attr("fill", (column) => color(column))
        .attr("cy", function (column) {
          const d = d3.select(this.parentNode).datum();
          return y(d[column]);
        });
    }

    function zoomed(event) {
      const newXDomain = event.transform.rescaleX(xContext).domain();
      if (
        !selectedXDomain ||
        newXDomain[0] !== selectedXDomain[0] ||
        newXDomain[1] !== selectedXDomain[1]
      ) {
        selectedXDomain = newXDomain;

        x.domain(selectedXDomain);

        gx.call(xAxis);

        g.selectAll(".focus-path").attr("d", (column) =>
          line(data.map((d) => [d.id, d[column]]))
        );
        gd.attr("transform", (d) => `translate(${x(d.id)},0)`);

        context.updateByZoom(
          x.range().map(event.transform.invertX, event.transform)
        );
      }
    }

    function updateByBrush(s) {
      x.domain(selectedXDomain);

      gx.call(xAxis);

      g.selectAll(".focus-path").attr("d", (column) =>
        line(data.map((d) => [d.id, d[column]]))
      );
      gd.attr("transform", (d) => `translate(${x(d.id)},0)`);

      const scale =
        (dimension.width - dimension.margin.left - dimension.margin.right) /
        (s[1] - s[0]);
      const translateX = dimension.margin.left - s[0] * scale;
      zoomRect.call(
        zoom.transform,
        d3.zoomIdentity.translate(translateX, 0).scale(scale)
      );
    }

    function updateSeries() {
      const filteredValueColumns = valueColumns.filter((column) =>
        selectedValueColumns.has(column)
      );
      g.selectAll(".focus-path").style("display", (column) =>
        selectedValueColumns.has(column) ? null : "none"
      );
      gd.select(".focus-line").each(function (d) {
        const extent = d3.extent(filteredValueColumns, (column) => d[column]);
        d3.select(this).attr("y1", y(extent[0])).attr("y2", y(extent[1]));
      });
      gd.selectAll(".focus-symbol").style("display", (column) =>
        selectedValueColumns.has(column) ? null : "none"
      );
    }

    function resize() {
      svg.attr("viewBox", [0, 0, dimension.width, dimension.height]);

      zoom
        .translateExtent([
          [dimension.margin.left, dimension.margin.top],
          [
            dimension.width - dimension.margin.right,
            dimension.height - dimension.margin.bottom,
          ],
        ])
        .extent([
          [dimension.margin.left, dimension.margin.top],
          [
            dimension.width - dimension.margin.right,
            dimension.height - dimension.margin.bottom,
          ],
        ]);

      clipRect.attr(
        "width",
        dimension.width -
          dimension.margin.left -
          dimension.margin.right +
          clipPadding * 2
      );

      zoomRect.attr(
        "width",
        dimension.width - dimension.margin.left - dimension.margin.right
      );

      if (!data) return;

      gx.call(xAxis);
      gy.call(yAxis);
      g.selectAll(".focus-path").attr("d", (column) =>
        line(data.map((d) => [d.id, d[column]]))
      );
      gd.attr("transform", (d) => `translate(${x(d.id)},0)`);
    }

    return {
      update,
      updateByBrush,
      updateSeries,
      resize,
    };
  }

  function renderContext() {
    const svg = d3
      .select(elContext)
      .append("svg")
      .attr("class", "context")
      .attr("viewBox", [0, 0, dimension.width, dimension.focusHeight])
      .attr("display", "block");

    const line = d3
      .line()
      .defined((d) => !(d[1] == null))
      .x((d) => x(d[0]))
      .y((d) => yContext(d[1]));

    const brush = d3.brushX().on("brush end", brushed);

    const xAxis = (g) =>
      g.call(
        d3
          .axisBottom(xContext)
          .ticks(dimension.width / 60, "d")
          .tickSizeOuter(0)
      );

    const gx = svg
      .append("g")
      .attr("class", "axis x-axis")
      .attr(
        "transform",
        `translate(0,${dimension.focusHeight - dimension.margin.focusBottom})`
      );
    const g = svg.append("g");
    const gb = svg.append("g").call(brush);

    function update() {
      xContext.domain(x.domain());
      yContext.domain(y.domain());

      gx.call(xAxis);

      g.selectAll(".context-path")
        .data(valueColumns)
        .join((enter) =>
          enter
            .append("path")
            .attr("class", "context-path")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
        )
        .style("display", null)
        .style("color", (column) => color(column))
        .attr("d", (column) => line(data.map((d) => [d.id, d[column]])));

      gb.call(brush.move, [
        dimension.margin.left,
        dimension.width - dimension.margin.right,
      ]);
    }

    function updateSeries() {
      g.selectAll(".context-path").style("display", (column) =>
        selectedValueColumns.has(column) ? null : "none"
      );
    }

    function updateByZoom(s) {
      gb.call(brush.move, s);
    }

    function brushed(event) {
      const s = event.selection || xContext.range();
      const newXDomain = s.map(xContext.invert, xContext);
      if (
        !selectedXDomain ||
        newXDomain[0] !== selectedXDomain[0] ||
        newXDomain[1] !== selectedXDomain[1]
      ) {
        selectedXDomain = newXDomain;
        focus.updateByBrush(s);
      }
    }

    function resize() {
      svg.attr("viewBox", [0, 0, dimension.width, dimension.focusHeight]);

      xContext.range([
        dimension.margin.left,
        dimension.width - dimension.margin.right,
      ]);

      brush.extent([
        [dimension.margin.left, 0.5],
        [
          dimension.width - dimension.margin.right,
          dimension.focusHeight - dimension.margin.focusBottom + 0.5,
        ],
      ]);

      gb.call(brush);

      if (!data) return;

      gx.call(xAxis);

      g.selectAll(".context-path").attr("d", (column) =>
        line(data.map((d) => [d.id, d[column]]))
      );

      gb.call(brush.move, selectedXDomain.map(xContext));
    }

    return {
      update,
      updateByZoom,
      updateSeries,
      resize,
    };
  }

  function resize() {
    dimension.width = elFocus.clientWidth;
    x.range([dimension.margin.left, dimension.width - dimension.margin.right]);
    focus.resize();
    context.resize();
  }

  function calculateMaxLabelSize() {
    let labelSizes = [];
    d3.select("body")
      .append("svg")
      .call((svg) =>
        svg
          .selectAll("text")
          .data(labels)
          .join("text")
          .attr("font-size", "12px")
          .attr("transform", "rotate(-90)")
          .text((d) => d)
          .each(function () {
            labelSizes.push(Math.ceil(this.getBBox().width));
          })
      )
      .remove();
    dimension.margin.labelSize = d3.max(labelSizes);
  }

  function update(newData) {
    data = newData.map((d, i) => Object.assign({ id: i + 1 }, d));
    labelColumn = newData.columns[0];
    valueColumns = newData.columns.slice(1);
    selectedValueColumns = new Set(valueColumns);

    labels = data.map((d) => d[labelColumn]);
    calculateMaxLabelSize();

    color.domain(valueColumns);
    x.domain([1, data.length]);
    y.domain([
      d3.min(valueColumns, (column) => d3.min(data, (d) => d[column])),
      d3.max(valueColumns, (column) => d3.max(data, (d) => d[column])),
    ])
      .range([dimension.height - dimension.margin.bottom, dimension.margin.top])
      .nice();

    legend.update();
    focus.update();
    context.update();
  }

  return {
    update,
  };
}
