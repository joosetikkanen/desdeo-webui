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
    mode: "lines",
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
    mode: "lines",
    name: "Band 1",
    showlegend: true,
    type: "scatter",
  };

  var trace3 = {
    x: [0, 0.5, 1],
    y: [0.9, 0.4, 0],
    line: { color: "transparent", shape: "spline" },
    legengroup: "band2",
    mode: "lines",
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
    mode: "lines",
    name: "Band 2",
    showlegend: true,
    type: "scatter",
  };

  var trace5 = {
    x: [0, 0.5, 1],
    y: [0, 0.9, 0],
    line: { color: "transparent", shape: "spline" },
    legengroup: "band3",
    mode: "lines",
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
    mode: "lines",
    name: "Band 3",
    showlegend: true,
    type: "scatter",
  };

  var trace7 = {
    x: [0, 0.5, 1],
    y: [0.9, 0, 0.9],
    line: { color: "transparent", shape: "spline" },
    legengroup: "band4",
    mode: "lines",
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

  var objectives = [
    { name: "Objective 1", position: 0 },
    { name: "Objective 2", position: 0.5 },
    { name: "Objective 3", position: 1 },
  ];
  var movableObjectives = objectives.slice(1, -1);

  var objectiveTrace = {
    x: [0, 0.5, 1],
    y: [1.1, 1.1, 1.1],
    mode: "text",
    textfont: { size: 10 },
    showlegend: false,
    text: ["Objective 1", "Objective 2", "Objective 3"],
    textposition: "top",
    type: "scatter",
  };

  var data = [
    trace1,
    trace2,
    trace3,
    trace4,
    trace5,
    trace6,
    trace7,
    trace8,
    objectiveTrace,
  ];

  // The initial layout
  var layout = {
    paper_bgcolor: "rgb(255,255,255)",
    plot_bgcolor: "rgb(229,229,229)",
    xaxis: {
      gridcolor: "rgb(255,255,255)",
      range: [-0.05, 1.05],
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
      range: [0, 1.2],
      showgrid: false,
      showline: false,
      showticklabels: false,
      tickcolor: "rgb(127,127,127)",
      ticks: "outside",
      zeroline: false,
    },
    dragmode: false,
  };

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
    // var sliderValue = document.getElementById("sliderValue");
    var dropdown = document.getElementById("dropdown");

    // Update SCORE bands and the layout when axis is repositioned with slider
    slider.addEventListener("input", function () {
      // sliderValue.textContent = this.value;

      var [newData, newLayout] = getUpdatedChartData(
        this.value,
        dropdown.value
      );

      Plotly.react("SCOREBands", newData, newLayout);
    });

    // Perform axis swap if axis is moved within 5% distance of another axis or over
    slider.addEventListener("mouseup", function () {
      let updatedTraces = [...data];
      let newTickVals = [...layout.xaxis.tickvals];
      let selectedObjectiveIndex = dropdown.value;

      for (let i = 0; i < newTickVals.length - 1; i++) {
        let dist =
          Math.round(Math.abs(newTickVals[i] - newTickVals[i + 1]) * 100) / 100;
        if (dist <= 0.05) {
          // Reset minimum distance of the axes to 5%
          let residue = Math.abs(0.05 - dist);
          if (i == selectedObjectiveIndex) {
            newTickVals[selectedObjectiveIndex] -= residue;
          } else {
            newTickVals[selectedObjectiveIndex] += residue;
          }

          for (let j = 0; j < updatedTraces.length; j++) {
            if (updatedTraces[j].mode === "text") {
              // Swap objective labels
              [updatedTraces[j].text[i], updatedTraces[j].text[i + 1]] = [
                updatedTraces[j].text[i + 1],
                updatedTraces[j].text[i],
              ];
            }
            // Swap data trace positions
            [updatedTraces[j].y[i], updatedTraces[j].y[i + 1]] = [
              updatedTraces[j].y[i + 1],
              updatedTraces[j].y[i],
            ];

            updatedTraces[j].x = newTickVals;
          }

          [objectives[i], objectives[i + 1]] = [
            objectives[i + 1],
            objectives[i],
          ];
          movableObjectives = objectives.slice(1, -1);
        }
      }

      let updatedLayout = { ...layout };
      updatedLayout.xaxis.tickvals = newTickVals;

      // Update slider accordingly
      slider.value = newTickVals[selectedObjectiveIndex] * 100;

      Plotly.update("SCOREBands", updatedTraces, updatedLayout);
    });

    // Update the slider value based on the selected objective
    dropdown.addEventListener("change", function () {
      var selectedObjectiveIndex = dropdown.value;
      var updatedSliderValue = trace1.x[selectedObjectiveIndex] * 100;

      slider.value = updatedSliderValue;
      // sliderValue.textContent = updatedSliderValue + "";
    });

    /**
     * Calculate new positions for the bands and the selected objective axis
     * with given slider value
     *
     * @param sliderValue Value of the slider
     * @param dropdownValue Selected objective axis
     */
    function getUpdatedChartData(sliderValue: number, dropdownValue: number) {
      let updatedTraces = [...data];
      updatedTraces.forEach((trace) => {
        trace.x[dropdownValue] = sliderValue / 100;
      });

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
        <option value={objectives.indexOf(objective)}>{objective.name}</option>
      {/each}
    </select>
    <input type="range" id="slider" min="0" max="100" />
    <!-- <span id="sliderValue" /> -->
  </div>
  <div id="SCOREBands" />
</div>

<style>
</style>
