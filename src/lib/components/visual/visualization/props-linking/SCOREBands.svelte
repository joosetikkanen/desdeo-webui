<!-- SCOREBands.svelte -->

<script lang="ts">
  import { onMount } from "svelte";
  import { colorPalette } from "$lib/components/visual/constants";

  import * as dtlz7 from "$lib/datasets/dtlz7.json";
  import * as AD1 from "$lib/datasets/AD1.json";
  import * as AD2 from "$lib/datasets/AD2.json";

  var datasets = { dtlz7: dtlz7, AD1: AD1, AD2: AD2 };

  var json = datasets.dtlz7;

  // Hexadecimal value in range of 00-FF
  let solutionOpacity = "ff";
  let bandOpacity = "aa";

  function parseData(json) {
    var jsonData = [...json.data];

    var jsonBands = { ...json.bands };

    let objectivesPositions = Object.entries(json.positions);

    // Sort the positions by the numeric value ascending
    objectivesPositions.sort((a, b) => a[1] - b[1]);

    const axisPositions = objectivesPositions.map((arr) => {
      return arr[1];
    });
    const axisLabels = objectivesPositions.map((arr) => {
      return arr[0];
    });

    // Find the maximum and minimum values for each field
    const maxValues: Record<string, number> = {};
    const minValues: Record<string, number> = {};

    axisLabels.forEach((key) => {
      maxValues[key] = -Infinity;
      minValues[key] = Infinity;
    });

    for (const obj of jsonData) {
      for (const key of Object.keys(obj)) {
        if (key === "group") {
          continue;
        }
        if (obj[key] > maxValues[key]) {
          maxValues[key] = obj[key];
        }
        if (obj[key] < minValues[key]) {
          minValues[key] = obj[key];
        }
      }
    }

    // Scale each field in each object to the range of 0 to 1
    for (const obj of jsonData) {
      for (const key of Object.keys(obj)) {
        if (key === "group") {
          continue;
        }

        obj[key] =
          (obj[key] - minValues[key]) / (maxValues[key] - minValues[key]);
      }
    }

    // Do the same scaling process for the band data
    axisLabels.forEach((key) => {
      maxValues[key] = -Infinity;
      minValues[key] = Infinity;
    });

    for (const band of Object.keys(jsonBands)) {
      for (const key of Object.keys(jsonBands[band])) {
        for (const objKey of Object.keys(jsonBands[band][key])) {
          const value = jsonBands[band][key][objKey];
          if (value > maxValues[objKey]) {
            maxValues[objKey] = value;
          }
          if (value < minValues[objKey]) {
            minValues[objKey] = value;
          }
        }
      }
    }

    for (const band of Object.keys(jsonBands)) {
      for (const key of Object.keys(jsonBands[band])) {
        for (const objKey of Object.keys(jsonBands[band][key])) {
          const value = jsonBands[band][key][objKey];
          jsonBands[band][key][objKey] =
            (value - minValues[objKey]) /
            (maxValues[objKey] - minValues[objKey]);
        }
      }
    }

    // Group the data by the cluster key
    const groupedData = jsonData.reduce((acc, obj) => {
      const groupKey = obj.group;
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(obj);
      return acc;
    }, {});

    let data = [];

    for (let clusterId in groupedData) {
      let legend = true;

      // Individual solutions
      for (let solution of groupedData[clusterId]) {
        data.push({
          x: axisPositions,
          y: axisLabels.map((label) => {
            return solution[label];
          }),
          line: {
            color: colorPalette[clusterId] + solutionOpacity,
          },
          legendgroup: "Solutions: Cluster " + clusterId,
          mode: "lines+markers",
          name: "Solutions: Cluster " + clusterId,
          showlegend: legend,
          type: "scatter",
        });
        legend = false;
      }

      // Lower bound of the band
      data.push({
        x: axisPositions,
        y: axisLabels.map((label) => {
          return jsonBands[clusterId].lower_bound[label];
        }),
        line: {
          color: colorPalette[clusterId] + solutionOpacity,
          shape: "spline",
        },
        marker: { color: "transparent" },
        legendgroup: "50% band: Cluster " + clusterId,
        mode: "lines+markers",
        name: "50% band: Cluster " + clusterId,
        showlegend: false,
        type: "scatter",
      });

      // Upper bound of the band
      data.push({
        x: axisPositions,
        y: axisLabels.map((label) => {
          return jsonBands[clusterId].upper_bound[label];
        }),
        fill: "tonexty",
        fillcolor: colorPalette[clusterId] + bandOpacity,
        line: {
          color: colorPalette[clusterId] + solutionOpacity,
          shape: "spline",
        },
        marker: { color: "transparent" },
        legendgroup: "50% band: Cluster " + clusterId,
        mode: "lines+markers",
        name: "50% band: Cluster " + clusterId,
        showlegend: true,
        type: "scatter",
      });

      // Median
      data.push({
        x: axisPositions,
        y: axisLabels.map((label) => {
          return jsonBands[clusterId].median[label];
        }),
        line: {
          color: colorPalette[clusterId] + solutionOpacity,
        },
        marker: {
          line: {
            color: "Black",
            width: 2,
          },
        },
        legendgroup: "Median: Cluster " + clusterId,
        mode: "lines+markers",
        name: "Median: Cluster " + clusterId,
        showlegend: true,
        type: "scatter",
      });
    }

    // Objective axis labels
    data.push({
      x: axisPositions,
      y: axisLabels.map(() => 1.1),
      mode: "text",
      textfont: { size: 10 },
      showlegend: false,
      text: axisLabels,
      textposition: "top",
      type: "scatter",
    });

    // The initial layout
    let layout = {
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
        tickvals: axisPositions,
        fixedrange: true,
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
        fixedrange: true,
      },
      dragmode: "select",
    };

    return [data, layout, objectivesPositions];
  }

  var [data, layout, objectivesPositions] = parseData(json);

  var movableObjectives = objectivesPositions.slice(1, -1);

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

    var plot = document.getElementById("SCOREBands");

    /* function removeDragElements() {
      const dragLayer = document.querySelector("#SCOREBands > div > div > svg:nth-child(1) > g.draglayer.cursor-crosshair > g");

      const childElements = dragLayer.children;

      for (let i = childElements.length - 1; i >= 0; i--) {
        const childElement = childElements[i];
        if (childElement.classList.contains("nsewdrag") && childElement.classList.contains("drag")) {
          continue;
        }
        childElement.remove();
      }

    } */

    //removeDragElements();

    //const removedElements = [];

    /** Removes the select box elements */
    /* function removeSelectBox() {
      const selectOutlineElements = document.querySelectorAll(
        "#SCOREBands .selectionlayer"
      );
      const selectZoomElements = document.querySelectorAll(
        "#SCOREBands .zoomlayer"
      );

      selectOutlineElements.forEach((element) => {
        removedElements.push(element);
        element.remove();
      });
      selectZoomElements.forEach((element) => {
        removedElements.push(element);
        element.remove();
      });

      const updatedLayout = {...layout};
      delete updatedLayout.selections;
      
      Plotly.react("SCOREBands", data, updatedLayout)
    } */

    /** Adds the removed select box elements back to the graph */
    /* function reAddSelectBox() {
      let container = document.querySelector(
        "#SCOREBands > div > div > svg:nth-child(1)"
      );
      
      while (removedElements.length > 0) {
        container.appendChild(removedElements.pop());
      }
    } */

    /** Re-add the select box and remove the highligths from traces on mouse-down */
    /* plot.addEventListener("mousedown", function (event) {

      //reAddSelectBox();
      

      const updatedData = data.map((trace) => {
        if (trace.fillcolor) {
          let fillColor = trace.fillcolor;
          return {
            ...trace,
            fillcolor: fillColor.slice(0, -2) + "77",
          };
        } else {
          return trace;
        }
      });

      const updatedLayout = {
        ...layout,
        selections: []
      }

      
      //Plotly.react("SCOREBands", updatedData, updatedLayout);
      //removeDragElements();
    }); */

    /**
     * Handles the select box logic. If no traces are selected on any axis,
     * removes the select box and trace highlights.
     */
    plot.on("plotly_selected", function (eventData) {
      const indices = [];
      const updatedFillcolors = [];

      for (let i = 0; i < data.length; i++) {
        let fillcolor = data[i].fillcolor;
        if (fillcolor) {
          indices.push(i);
          updatedFillcolors.push(fillcolor.slice(0, -2) + "77");
        }
      }

      // Remove highlights
      Plotly.restyle("SCOREBands", { fillcolor: updatedFillcolors }, indices);

      const updatedLayout = {
        ...layout,
        selections: [],
      };

      // Remove select box
      Plotly.relayout("SCOREBands", updatedLayout);

      if (eventData) {
        /*  if (eventData.points.length == 0) {
          
          //removeDragElements();
          //return;
        }*/

        //reAddSelectBox();

        const selectedFillcolors = eventData.points.filter(
          (point) => point.data.fillcolor
        );

        const selectedIndices = selectedFillcolors.map(
          (point) => point.curveNumber
        );

        const updatedFillcolors = selectedFillcolors.map(
          (point) => point.data.fillcolor.slice(0, -2) + "ff"
        );

        // Highlight selected traces
        Plotly.restyle(
          "SCOREBands",
          { fillcolor: updatedFillcolors },
          selectedIndices
        );
      }
      //removeDragElements();
    });

    var slider = document.getElementById("slider");
    var sliderValue = document.getElementById("sliderValue");
    var dropdown = document.getElementById("dropdown");
    var datasetsDropdown = document.getElementById("datasets");

    datasetsDropdown.addEventListener("change", function () {
      json = datasets[this.value];
      [data, layout, objectivesPositions] = parseData(json);
      movableObjectives = objectivesPositions.slice(1, -1);
      Plotly.react("SCOREBands", data, layout);
      sliderValue.textContent = movableObjectives[0][1];
      dropdown.value = 1;
    });

    var axisOrigPos;
    slider.addEventListener("mousedown", function () {
      axisOrigPos = layout.xaxis.tickvals[dropdown.value];
    });

    // Update SCORE bands and the layout when axis is repositioned with slider
    slider.addEventListener("input", function () {
      //removeSelectBox();

      /* var [newData, newLayout] = getUpdatedChartData(
        this.value,
        dropdown.value
      );

      Plotly.react("SCOREBands", newData, newLayout); */
      sliderValue.textContent = slider.value / 100;
    });

    // Perform axis swap if axis is moved within 5% distance of another axis or over
    slider.addEventListener("mouseup", function () {
      /* var [newData, newLayout] = getUpdatedChartData(
        this.value,
        dropdown.value
      );

      Plotly.react("SCOREBands", newData, newLayout); */

      /* let updatedTraces = [...data];
      updatedTraces.forEach((trace) => {
        trace.x[dropdownValue] = sliderValue / 100;
      });

      let newTickVals = [...layout.xaxis.tickvals];
      newTickVals[dropdownValue] = sliderValue / 100;

      let updatedLayout = { ...layout };
      updatedLayout.xaxis.tickvals = newTickVals;

      // Refresh the current state of the plot
      data = updatedTraces;
      layout = updatedLayout; */

      let updatedTraces;
      let origTickVals = [...layout.xaxis.tickvals];
      let selectedAxisIndex: number = parseInt(dropdown.value);

      let axisNewPos = this.value / 100;
      let refAxisIndex: number;
      let resetPos;
      let swap = false;

      // Determine which direction the axis was moved
      if (axisOrigPos - axisNewPos > 0) {
        // Left
        refAxisIndex = selectedAxisIndex - 1;
        resetPos = origTickVals[refAxisIndex] + 0.05;
        swap = axisNewPos <= resetPos;
      } else {
        // Right
        refAxisIndex = selectedAxisIndex + 1;
        resetPos = origTickVals[refAxisIndex] - 0.05;
        swap = axisNewPos >= resetPos;
      }

      let newTickVals = [...origTickVals];

      if (swap) {
        newTickVals[selectedAxisIndex] = resetPos;

        updatedTraces = data.map((trace) => {
          if (trace.mode === "text") {
            // Swap objective labels
            [trace.text[selectedAxisIndex], trace.text[refAxisIndex]] = [
              trace.text[refAxisIndex],
              trace.text[selectedAxisIndex],
            ];
          }

          //[trace.y[selectedAxisIndex], trace.y[refAxisIndex]] = [trace.y[refAxisIndex], trace.y[selectedAxisIndex]]
          let temp = trace.y[selectedAxisIndex];
          trace.y[selectedAxisIndex] = trace.y[refAxisIndex];
          trace.y[refAxisIndex] = temp;
          trace.x = newTickVals;
          //[trace.x[selectedAxisIndex], trace.x[refAxisIndex]] = [trace.x[refAxisIndex], trace.x[selectedAxisIndex]]
          return trace;
        });

        [
          objectivesPositions[selectedAxisIndex],
          objectivesPositions[refAxisIndex],
        ] = [
          objectivesPositions[refAxisIndex],
          objectivesPositions[selectedAxisIndex],
        ];
        movableObjectives = objectivesPositions.slice(1, -1);

        // Update slider accordingly
        if (
          newTickVals[refAxisIndex] <= 0.05 ||
          newTickVals[refAxisIndex] >= 0.95
        ) {
          slider.value = newTickVals[selectedAxisIndex] * 100;
          sliderValue.textContent = newTickVals[selectedAxisIndex];
        } else {
          slider.value = newTickVals[refAxisIndex] * 100;
          sliderValue.textContent = newTickVals[refAxisIndex];
          dropdown.value = refAxisIndex;
        }
      } else {
        newTickVals[selectedAxisIndex] = axisNewPos;
        updatedTraces = data.map((trace) => {
          trace.x = newTickVals;
          return trace;
        });
      }

      /* for (let i = 0; i < newTickVals.length - 1; i++) {
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

          [objectivesPositions[i], objectivesPositions[i + 1]] = [
            objectivesPositions[i + 1],
            objectivesPositions[i],
          ];
          movableObjectives = objectivesPositions.slice(1, -1);
        }
      } */

      let updatedLayout = { ...layout };
      updatedLayout.xaxis.tickvals = newTickVals;

      Plotly.update("SCOREBands", updatedTraces, updatedLayout);

      // Refresh the current state of the plot
      data = updatedTraces;
      layout = updatedLayout;
    });

    // Update the slider value based on the selected objective
    dropdown.addEventListener("change", function () {
      // var selectedObjectiveIndex = dropdown.value;
      var updatedSliderValue = layout.xaxis.tickvals[dropdown.value] * 100;

      slider.value = updatedSliderValue;
      sliderValue.textContent = updatedSliderValue / 100 + "";
    });

    /**
     * Calculate new positions for the bands and the selected objective axis
     * with given slider value
     *
     * @param sliderValue Value of the slider
     * @param dropdownValue Selected objective axis
     */
    /* function getUpdatedChartData(sliderValue: number, dropdownValue: number) {
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
    } */
  });
</script>

<div>
  <div>
    Dataset:
    <select id="datasets">
      {#each Object.keys(datasets) as dataset}
        <option value={dataset}>{dataset}</option>
      {/each}
    </select>
    Objective:
    <select id="dropdown">
      <!-- {#each movableObjectives as objective}
        <option value={objectives.indexOf(objective)}>{objective.name}</option>
      {/each} -->
      {#each movableObjectives as obj}
        <option value={objectivesPositions.indexOf(obj)}>{obj[0]}</option>
      {/each}
    </select>
    <input
      type="range"
      id="slider"
      min="0"
      max="100"
      value={layout.xaxis.tickvals[1] * 100}
    />
    <span id="sliderValue">{movableObjectives[0][1]}</span>
  </div>
  <div id="SCOREBands" />
</div>

<style>
</style>
