const DATA_URL = "../Data/data.csv";

const myTooltip = tooltip(document.querySelector("#tooltip-container"));

const dispatch = d3.dispatch(
  "tableupdate",
  "colorchange",
  "countrystatechange"
);

const color = d3.scaleQuantize();
const colorSchemeSelectEl = document.querySelector("#color-scheme-select");
colorSchemeSelect(colorSchemeSelectEl, color, dispatch);

// Help button
document.querySelector("#dropdown-help").addEventListener("click", function () {
  this.classList.toggle("is-active");
});

d3.csv(DATA_URL).then((csv) => {
  // Add x values
  const xs = [
    "Total N",
    "Total P",
    "Total N: total P",
    "Ammonium",
    "DIN",
    "DON",
    "Nitrate",
    "Nitrate + nitrite",
    "Nitrite",
    "SRP",
    "TKN",
    "Other",
  ];
  const data = processData(csv, xs);
  const groupedData = groupData(data, xs);
  color.domain([0, d3.max(groupedData, (d) => d.value)]).nice();

  heatmapLegend(document.querySelector("#chart-legend-container"), color);

  const myHeatmapChart = heatmapChart(
    document.querySelector("#chart-container"),
    groupedData,
    color,
    myTooltip,
    dispatch
  );

  const countries = [...new Set(data.map((d) => d.country))].sort();
  const states = (() => {
    const states = [...new Set(data.flatMap((d) => d.states))]
      .filter((d) => d !== null)
      .sort();
    const unknownIndex = states.findIndex((d) => d === "Unknown");
    if (unknownIndex !== -1) {
      states.splice(unknownIndex, 1);
      states.push("Unknown");
    }
    return states;
  })();

  let filters = {
    countries: countries.slice(),
    states: states.slice(),
  };

  new CountryStateSelect({
    el: document.querySelector("#country-state-select"),
    countries,
    states,
    selectedCountries: filters.countries,
    selectedStates: filters.states,
    dispatch,
  });

  let groupedFilteredData;
  dispatch.on("countrystatechange", ({ countries, states }) => {
    filters = Object.assign(filters, { countries, states });
    const filteredData = filterData(data, filters);
    groupedFilteredData = groupData(filteredData, xs);
    myHeatmapChart.updateData(groupedFilteredData);
    dispatch.call("tableupdate", null, null);
  });

  // Table columns
  const columns = [
    {
      formatter: "rownum",
      hozAlign: "right",
      headerSort: false,
      download: false,
    },
    {
      title: "Pearson CCs",
      field: "count",
      hozAlign: "right",
      sorter: "number",
    },
    { title: "Paper", field: "paper", hozAlign: "left", sorter: "string" },
    {
      title: "HERO ID",
      field: "heroId",
      hozAlign: "left",
      sorter: "string",
      formatter: (cell, formatterParams) => {
        const value = cell.getValue();
        return `<a href="https://hero.epa.gov/hero/index.cfm/reference/details/reference_id/${value}" target="hero-tab">${value}</a>`;
      },
    },
    { title: "Country", field: "country", hozAlign: "left", sorter: "string" },
  ];
  dataTable(document.querySelector("#table-container"), columns, dispatch);

  // Fix table height to the same as the heatmap height
  document.querySelector("#table-container").style.height =
    document.querySelector("#chart-container").clientHeight + 6 + "px"; // 6 for the border widths

  // Initial color
  colorSchemeSelectEl.options.selectedIndex = 0;
  colorSchemeSelectEl.dispatchEvent(new Event("change"));
});

function processData(csv, xs) {
  // Only keep rows with response measure value
  const hasYiValue = (d) => d["yi"] !== "NA";
  const hasCIValue = (d) => d["conf_interval"] !== "NA";
  const hasValue = (d) => d["RESPONSE.MEASURE.VALUE"] !== "NA";
  const hasXValue = (d) => xs.includes(d["CAUSE.TERM"].trim());

  const stateColumns = (() => {
    const i0 = csv.columns.indexOf("ALABAMA");
    return csv.columns.slice(i0, i0 + 51);
  })();
  const formatStateName = (d) =>
    d
      .split(".")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");
  const getStates = (d) => {
    const states = stateColumns.reduce((states, column) => {
      if (d[column] === "1") states.push(formatStateName(column));
      return states;
    }, []);
    if (states.length > 0) return states;
    return ["Unknown"];
  };
  csv = csv.filter(
    (d) => hasYiValue(d) && hasCIValue(d) && hasValue(d) && hasXValue(d)
  );
  csv.forEach((d) => {
    d.country = d.COUNTRY;
    d.states = d.COUNTRY === "United States" ? getStates(d) : null;
  });
  return csv;
}

function filterData(data, filters) {
  return data.filter((d) => {
    if (!filters.countries.includes(d.country)) return false;
    if (d.states && d3.disjoint(filters.states, d.states)) return false;
    return true;
  });
}

function groupData(data, xs) {
  // Count number of rows for each unique x,y values
  const grouped = Array.from(
    d3.rollup(
      data,
      (v) => {
        const value = v.length; // Total number of entries
        // Generate papers list for each heatmap cell
        const papers = Array.from(
          d3
            .rollup(
              v,
              (w) => {
                const count = w.length;
                const paper = w[0].paper;
                const heroId = w[0]["HERO.ID"];
                const country = w[0]["COUNTRY"];
                return {
                  count,
                  paper,
                  heroId,
                  country,
                };
              },
              (d) => d["CITATION.ID"]
            )
            .values()
        );
        return {
          value,
          papers,
        };
      },
      (d) =>
        `${d["CAUSE.TERM"]}|${[d["EFFECT.TERM"], d["EFFECT.MEASURE"]].join(
          " "
        )}`
    ),
    ([key, value]) => {
      const [x, y] = key.split("|");
      value.x = x;
      value.y = y;
      return value;
    }
  );
  // Add y values
  grouped.xs = xs;
  grouped.ys = Array.from(new Set(grouped.map((d) => d.y))).sort();
  return grouped;
}
