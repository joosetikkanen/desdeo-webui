<!-- SCOREBands.svelte -->

<script lang="ts">
  import { onMount } from "svelte";
  import { colorPalette } from "$lib/components/visual/constants";

  // Add some sample data
  var trace1 = {
    x: [0, 0.5, 1],
    y: [0, 0.4, 0.9],
    line: { color: "transparent", shape: "spline" },
    legengroup: "band1",
    name: "Band 1",
    showlegend: false,
    type: "scatter",
  };

  var trace2 = {
    x: [0, 0.5, 1],
    y: [0.1, 0.5, 1],
    fill: "tonexty",
    fillcolor: colorPalette[0] + "aa",
    line: { color: "transparent", shape: "spline" },
    legengroup: "band1",
    name: "Band 1",
    showlegend: true,
    type: "scatter",
  };

  var trace3 = {
    x: [0, 0.5, 1],
    y: [0.9, 0.4, 0],
    line: { color: "transparent", shape: "spline" },
    legengroup: "band2",
    name: "Band 2",
    showlegend: false,
    type: "scatter",
  };

  var trace4 = {
    x: [0, 0.5, 1],
    y: [1, 0.5, 0.1],
    fill: "tonexty",
    fillcolor: colorPalette[1] + "aa",
    line: { color: "transparent", shape: "spline" },
    legengroup: "band2",
    name: "Band 2",
    showlegend: true,
    type: "scatter",
  };

  var trace5 = {
    x: [0, 0.5, 1],
    y: [0, 0.9, 0],
    line: { color: "transparent", shape: "spline" },
    legengroup: "band3",
    name: "Band 3",
    showlegend: false,
    type: "scatter",
  };

  var trace6 = {
    x: [0, 0.5, 1],
    y: [0.1, 1, 0.1],
    fill: "tonexty",
    fillcolor: colorPalette[2] + "aa",
    line: { color: "transparent", shape: "spline" },
    legengroup: "band3",
    name: "Band 3",
    showlegend: true,
    type: "scatter",
  };

  var trace7 = {
    x: [0, 0.5, 1],
    y: [0.9, 0, 0.9],
    line: { color: "transparent", shape: "spline" },
    legengroup: "band4",
    name: "Band 4",
    showlegend: false,
    type: "scatter",
  };

  var trace8 = {
    x: [0, 0.5, 1],
    y: [1, 0.1, 1],
    fill: "tonexty",
    fillcolor: colorPalette[3] + "aa",
    line: { color: "transparent", shape: "spline" },
    legengroup: "band4",
    mode: "lines",
    name: "Band 4",
    showlegend: true,
    type: "scatter",
  };

  var data = [trace1, trace2, trace3, trace4, trace5, trace6, trace7, trace8];

  // The initial layout
  var layout = {
    paper_bgcolor: "rgb(255,255,255)",
    plot_bgcolor: "rgb(229,229,229)",
    xaxis: {
      gridcolor: "rgb(255,255,255)",
      range: [0, 1],
      showgrid: true,
      showline: false,
      showticklabels: true,
      tickcolor: "rgb(127,127,127)",
      ticks: "outside",
      zeroline: false,
      tickvals: [0, 0.5, 1],
    },
    yaxis: {
      gridcolor: "rgb(255,255,255)",
      range: [0, 1],
      showgrid: false,
      showline: false,
      showticklabels: false,
      tickcolor: "rgb(127,127,127)",
      ticks: "outside",
      zeroline: false,
    },
    dragmode: false,
  };

  var objectives = [0, 1, 2];
  var movableObjectives = objectives.slice(1, -1);

  // Seems that plotly.js only works in the browser, so have to use dynamic import
  onMount(async () => {
    const Plotly = await import("plotly.js-dist-min");

    let removeButtons = [
      "zoom2d",
      "pan2d",
      "select2d",
      "lasso2d",
      "zoomIn2d",
      "zoomOut2d",
      "autoScale2d",
      "resetScale2d",
    ];

    Plotly.newPlot("SCOREBands", data, layout, {
      modeBarButtonsToRemove: removeButtons,
      displaylogo: false,
    });

    var slider = document.getElementById("slider");
    var sliderValue = document.getElementById("sliderValue");
    var dropdown = document.getElementById("dropdown");

    // Update SCORE bands and the layout when axis is repositioned with slider
    slider.addEventListener("input", function () {
      sliderValue.textContent = this.value;

      var [newData, newLayout] = getUpdatedChartData(
        this.value,
        dropdown.value
      );

      Plotly.react("SCOREBands", newData, newLayout);
    });

    // Update the slider value based on the selected objective
    dropdown.addEventListener("change", function () {
      var selectedObjectiveIndex = dropdown.value;
      var updatedSliderValue = trace1.x[selectedObjectiveIndex] * 100;

      slider.value = updatedSliderValue;
      sliderValue.textContent = updatedSliderValue + "";
    });

    /**
     * Calculate new positions for the bands and the selected objective axis
     * with given slider value
     *
     * @param sliderValue New axis position given with slider
     * @param dropdownValue Selected objective axis
     */
    function getUpdatedChartData(sliderValue, dropdownValue) {
      let updatedTraces = [];
      for (let trace of data) {
        let updatedTrace = { ...trace };

        updatedTrace.x[dropdownValue] = sliderValue / 100;

        updatedTraces.push(updatedTrace);
      }

      let newTickVals = [...layout.xaxis.tickvals];
      newTickVals[dropdownValue] = sliderValue / 100;

      let updatedLayout = { ...layout };
      updatedLayout.xaxis.tickvals = newTickVals;

      // Refresh the current state of the plot
      data = updatedTraces;
      layout = updatedLayout;

      return [updatedTraces, updatedLayout];
    }
  });
</script>

<div>
  <div>
    <select id="dropdown">
      {#each movableObjectives as objective}
        <option value={objective}>Objective {objective + 1}</option>
      {/each}
    </select>
    <input type="range" id="slider" min="0" max="100" />
    <span id="sliderValue" />
  </div>
  <div id="SCOREBands" />
</div>

<style>
</style>
