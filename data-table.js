function dataTable(el, columns, dispatch) {
  let tableData, cause, effect;
  const container = d3.select(el).classed("is-hidden", true);
  const inner = container.append("div").attr("class", "w-100");
  const header = inner
    .append("div")
    .attr(
      "class",
      "is-flex is-justify-content-space-between is-align-items-baseline"
    );
  const title = header.append("h2").attr("class", "title is-size-6 mr-3");
  const csvButton = header
    .append("button")
    .attr("class", "button is-small")
    .text("Download CSV")
    .on("click", downloadCSV);
  const table = inner
    .append("div")
    .attr("class", "table-container")
    .append("table")
    .attr("class", "table is-bordered is-narrow");
  const tabular = new Tabulator(table.node(), {
    layout: "fitDataStretch",
    selectable: false,
    columns,
  });

  dispatch.on("tableupdate.data-table", (d) => {
    if (d) {
      tableData = d.papers;
      cause = d.x;
      effect = d.y;
      container.classed("is-hidden", false);
      title.text(`Cause: ${cause}, Effect: ${effect}`);
      tabular.replaceData(tableData);

      el.scrollIntoView({
        behavior: "smooth",
      });
    } else {
      container.classed("is-hidden", true);
    }
  });

  // https://github.com/olifolkerd/tabulator/blob/master/src/js/modules/download.js#L112
  function csvFormatter(list, options, setFileContents) {
    var delimiter = options && options.delimiter ? options.delimiter : ",",
      fileContents = [],
      headers = [];
    list.forEach((row) => {
      var item = [];
      switch (row.type) {
        case "header":
          row.columns.forEach((col, i) => {
            if (col && col.depth === 1) {
              headers[i] =
                typeof col.value == "undefined" || col.value === null
                  ? ""
                  : '"' + String(col.value).split('"').join('""') + '"';
            }
          });
          break;
        case "row":
          row.columns.forEach((col) => {
            if (col) {
              switch (typeof col.value) {
                case "object":
                  col.value = JSON.stringify(col.value);
                  break;

                case "undefined":
                case "null":
                  col.value = "";
                  break;
              }

              item.push('"' + String(col.value).split('"').join('""') + '"');
            }
          });
          fileContents.push(item.join(delimiter));
          break;
      }
    });
    if (headers.length) {
      fileContents.unshift(headers.join(delimiter));
    }
    fileContents.unshift([`${cause}_${effect}`]); // Add cause and effect to the first row
    fileContents = fileContents.join("\n");
    if (options.bom) {
      fileContents = "\ufeff" + fileContents;
    }
    setFileContents(fileContents, "text/csv");
  }

  function downloadCSV() {
    tabular.download(csvFormatter, `${cause}_${effect}.csv`);
  }
}
