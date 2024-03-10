<!-- SCOREBands.svelte -->

<script lang="ts">
  import { onMount } from "svelte";

  // Seems that plotly.js only works in the browser, so have to use dynamic import
  onMount(async () => {
    const Plotly = await import("plotly.js-dist-min");

    // Add some sample data
    var trace1 = {
      x: [0, 0.5, 1, 1, 0.5, 0],
      y: [0, 0.4, 0.9, 1, 0.5, 0.1],
      fill: "tozerox",
      fillcolor: "rgba(0,100,80,0.2)",
      line: { color: "transparent", shape: "spline" },
      name: "Fair",
      showlegend: false,
      type: "scatter",
    };

    var trace2 = {
      x: [0, 0.5, 1, 1, 0.5, 0],
      y: [1, 0.5, 0.1, 0, 0.4, 0.9],
      fill: "tozerox",
      fillcolor: "rgba(0,176,246,0.2)",
      line: { color: "transparent", shape: "spline" },
      name: "Premium",
      showlegend: false,
      type: "scatter",
    };

    var trace3 = {
      x: [0, 0.5, 1, 1, 0.5, 0],
      y: [0, 0.9, 0, 0.1, 1, 0.1],
      fill: "tozerox",
      fillcolor: "rgba(231,107,243,0.2)",
      line: { color: "transparent", shape: "spline" },
      name: "Fair",
      showlegend: false,
      type: "scatter",
    };

    var trace4 = {
      x: [0, 0.5, 1, 1, 0.5, 0],
      y: [0.9, 0, 0.9, 1, 0.1, 1],
      fill: "tozerox",
      fillcolor: "rgba(255, 20, 20, 0.2)",
      line: { color: "transparent", shape: "spline" },
      mode: "lines",
      name: "Fair",
      showlegend: false,
      type: "scatter",
    };

    /* var trace5 = {
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [5, 2.5, 5, 7.5, 5, 2.5, 7.5, 4.5, 5.5, 5],
      line: { color: "rgb(0,176,246)", shape: "spline" },
      mode: "lines",
      name: "Premium",
      type: "scatter",
    };

    var trace6 = {
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [10, 8, 6, 4, 2, 0, 2, 4, 2, 0],
      line: { color: "rgb(231,107,243)", shape: "spline" },
      mode: "lines",
      name: "Ideal",
      type: "scatter",
    }; */

    var data = [trace1, trace2, trace3, trace4];

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
    Plotly.newPlot("SCOREBands", data, layout);

    var slider = document.getElementById("slider");
    var sliderValue = document.getElementById("sliderValue");
    var dropdown = document.getElementById("dropdown");

    // Update SCORE bands when axis is repositioned with slider
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
     * Updated the SCORE bands and axis position
     *
     * @param sliderValue New axis position given with slider
     * @param dropdownValue Selected objective axis
     */
    function getUpdatedChartData(sliderValue, dropdownValue) {
      let updatedTraces = [];
      for (let trace of data) {
        let updatedTrace = { ...trace };

        updatedTrace.x[dropdownValue] = sliderValue / 100;
        updatedTrace.x[updatedTrace.x.length - 1 - dropdownValue] =
          sliderValue / 100;

        updatedTraces.push(updatedTrace);
      }

      let newTickVals = [...layout.xaxis.tickvals];
      newTickVals[dropdownValue] = sliderValue / 100;

      let updatedLayout = { ...layout };
      updatedLayout.xaxis.tickvals = newTickVals;

      data = updatedTraces;
      layout = updatedLayout;
      return [updatedTraces, updatedLayout];
    }
  });
</script>

<div>
  <div>
    <select id="dropdown">
      <option value="0">Objective 1</option>
      <option value="1">Objective 2</option>
      <option value="2">Objective 3</option>
    </select>
    <input type="range" id="slider" min="0" max="100" value="0" />
    <span id="sliderValue">0</span>
  </div>
  <div id="SCOREBands" />
</div>

<style>
</style>
