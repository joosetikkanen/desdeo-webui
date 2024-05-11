<!-- SCOREBands.svelte -->

<script lang="ts">
  import { onMount } from "svelte";
  import { colorPalette } from "$lib/components/visual/constants";

  import * as dtlz7 from "$lib/datasets/dtlz7.json";
  import * as AD1 from "$lib/datasets/AD1.json";
  import * as AD2 from "$lib/datasets/AD2.json";
  import type {
    Layout,
    ModeBarDefaultButtons,
    PlotData,
    PlotlyHTMLElement,
  } from "plotly.js";
  import _ from "lodash";

  const datasets: Record<string, JSON> = { dtlz7: dtlz7, AD1: AD1, AD2: AD2 };

  // Hexadecimal value in range of 00-FF
  const solutionOpacity = "ff";
  const bandOpacity = "aa";

  // Amount of evenly spaced numbers visible on each axis
  const steps = 6;

  const axisValueHeights = Array.from(
    { length: steps },
    (_, i) => (1 / (steps - 1)) * i
  );

  /**
   * State variables for plot data, layout and objective labels with their
   * positions
   */
  var [data, layout, objectivesPositions] = parseData(datasets.dtlz7);

  /** State variable for keeping outermost axes static */
  var movableObjectives = objectivesPositions.slice(1, -1);

  let sliderValue = layout.xaxis.tickvals[1];

  /**
   * Two-way binding to ensure that both the variable and the input slider stay
   * synchronized.
   *
   * @param event
   */
  function handleChange(event) {
    sliderValue = event.target.value;
  }

  var enableSwapping: boolean;

  /**
   * Parses the solutions, bands and objective axis positions given in JSON
   * format.
   *
   * @param json
   * @returns An array of data traces list, the layout of the plot and a list of
   *   objective axis labels and their positions
   */
  function parseData(
    json
  ): [Partial<PlotData>[], Partial<Layout>, [string, number][]] {
    // Deep cloning of the solution data is required for preserving the original values after scaling them to the range of 0 to 1.
    const jsonData = _.cloneDeep(json.data);

    let jsonBands = { ...json.bands };

    let objectivesPositions: [string, number][] = Object.entries(
      json.positions
    );

    // Sort the positions by the numeric value ascending
    objectivesPositions.sort((a, b) => a[1] - b[1]);

    const axisLabels = objectivesPositions.map((arr) => {
      return arr[0];
    });

    const axisPositions = objectivesPositions.map((arr) => {
      return arr[1];
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

    const axisValueLabels: { [key: string]: string[] } = {};

    // Generate evenly spaced arrays for each key
    Object.keys(minValues).forEach((key) => {
      const min = minValues[key];
      const max = maxValues[key];
      const step = (max - min) / (steps - 1);
      axisValueLabels[key] = Array.from({ length: steps }, (_, i) =>
        (min + step * i).toFixed(1)
      );
    });

    const scaledData = [...jsonData];

    // Scale each field in each object to the range of 0 to 1
    for (const obj of scaledData) {
      for (const key of Object.keys(obj)) {
        if (key === "group") {
          continue;
        }

        obj[key] =
          (obj[key] - minValues[key]) / (maxValues[key] - minValues[key]);
      }
    }

    // Repeat the scaling process for the band data
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
    const groupedData = scaledData.reduce((acc, obj) => {
      const groupKey = obj.group;
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(obj);
      return acc;
    }, {});

    let data: Partial<PlotData>[] = [];

    for (const clusterId in groupedData) {
      let solutionCount = groupedData[clusterId].length;

      // Lower bound of the band
      data.push({
        x: axisPositions,
        y: axisLabels.map((label) => {
          return jsonBands[clusterId].lower_bound[label];
        }),
        line: {
          color: colorPalette[clusterId] + "ff",
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
          color: colorPalette[clusterId] + "ff",
          shape: "spline",
        },
        marker: { color: "transparent" },
        legendgroup: "50% band: Cluster " + clusterId,
        mode: "lines+markers",
        name: `50% band: Cluster ${clusterId}; ${solutionCount} Solutions`,
        showlegend: true,
        type: "scatter",
      });

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
          visible: "legendonly",
        });
        legend = false;
      }

      // Median
      data.push({
        x: axisPositions,
        y: axisLabels.map((label) => {
          return jsonBands[clusterId].median[label];
        }),
        line: {
          color: colorPalette[clusterId] + "ff",
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
        visible: "legendonly",
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
      ids: axisLabels.map((label) => `objective label ${label}`),
      name: "Objective",
      textposition: "top center",
      type: "scatter",
    });

    // Objective axes
    for (let obj of objectivesPositions) {
      data.push({
        x: axisValueHeights.map(() => obj[1]),
        y: axisValueHeights,
        mode: "text+lines+markers",
        name: "Objective axis " + obj[0],
        text: axisValueLabels[obj[0]],
        textposition: "middle left",
        textfont: { size: 9 },
        marker: {
          opacity: 0.2,
          size: 5,
        },
        type: "scatter",
        line: {
          color: "black",
        },
        showlegend: false,
      });
    }

    // The initial layout
    let layout: Partial<Layout> = {
      /* paper_bgcolor: "rgb(255,255,255)",
      plot_bgcolor: "rgb(229,229,229)", */
      paper_bgcolor: "rgb(232 234 241)",
      plot_bgcolor: "rgb(232 234 241)",
      xaxis: {
        //gridcolor: "rgb(255,255,255)",
        range: [-0.1, 1.1],
        //showgrid: true,
        //showline: false,
        gridcolor: "rgb(232 234 241)",
        showticklabels: false,
        tickcolor: "rgb(127,127,127)",
        ticks: "",
        zeroline: false,
        tickvals: axisPositions,
        fixedrange: true,
      },
      yaxis: {
        gridcolor: "rgb(255,255,255)",
        range: [-0.05, 1.2],
        showgrid: false,
        //showline: false,
        showticklabels: false,
        tickcolor: "rgb(127,127,127)",
        ticks: "",
        zeroline: false,
        fixedrange: true,
      },
      dragmode: "select",
      margin: {
        l: 0,
        b: 0,
        t: 40,
        r: 0,
      },

      /* sliders: [{
        pad: {t: 30, l: 30, r: 30},
        steps: Array.from({ length: 101 }, (_, index) => ({ 
          value: index / 100 + "",
          label: '',
          method: 'skip',
          args: ['line.color', 'green']
         }))
      }]
      */
    };

    return [data, layout, objectivesPositions];
  }

  // Seems that plotly.js only works in the browser, so have to use dynamic import
  onMount(async () => {
    const Plotly = await import("plotly.js-dist-min");

    let removeButtons: ModeBarDefaultButtons[] = [
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

    var plot = document.getElementById("SCOREBands") as PlotlyHTMLElement;

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
      const updatedLineColors = [];

      for (let i = 0; i < data.length; i++) {
        const line = data[i].line;
        const name = data[i].name;
        if (line && line.color && name && name.startsWith("Solutions")) {
          const clusterId = parseInt(name.charAt(name.length - 1));
          indices.push(i);
          updatedLineColors.push(
            //line.color.toString().slice(0, -2) + solutionOpacity
            colorPalette[clusterId] + solutionOpacity
          );
        }
      }

      // Remove highlights
      Plotly.restyle(
        "SCOREBands",
        { "line.color": updatedLineColors },
        indices
      );

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

        /* const selectedFillcolors = eventData.points.filter(
          (point) => point.data.fillcolor
        );

        const selectedIndices = selectedFillcolors.map(
          (point) => point.curveNumber
        );

        const updatedFillcolors = selectedFillcolors.map(
          (point) => point.data.fillcolor.slice(0, -2) + "ff"
        ); */

        const selectedLineColors = eventData.points.filter(
          (point) =>
            point.data.line &&
            point.data.line.color &&
            point.data.name.startsWith("Solutions")
        );

        const selectedIndices = selectedLineColors.map(
          (point) => point.curveNumber
        );

        const updatedLineColors = selectedLineColors.map(
          //(point) => point.data.line.color.slice(0, -2) + "ff"
          () => "black"
        );

        // Highlight selected traces
        Plotly.restyle(
          "SCOREBands",
          {
            "line.color": updatedLineColors,
            selected: {
              marker: { color: "black", opacity: 1 },
              textfont: { color: "black" },
            },
            unselected: {
              marker: {},
              textfont: { color: "black" },
            },
          },
          selectedIndices
        );

        /* Plotly.restyle("SCOREBands", {
          ,
        }); */
      }
      //removeDragElements();
    });

    /**
     * Update the slider position and selected objective in the dropdown menu.
     * Does not allow selecting the outermost axes.
     *
     * @param i The axis index
     */
    function selectAxis(i: number) {
      if (i === 0 || i >= objectivesPositions.length - 1) return;

      // Workaround to ensure that Svelte rerenders the slider after it has been moved and all possible calculations
      // regarding the new slider position have been done, so the user input does not take priority,
      // e.g. when the axis is moved too close to another axis,
      setTimeout(() => {
        sliderValue = objectivesPositions[i][1] + "";
        dropdown.value = i + "";
      }, 1);

      /* if (navigator.userAgent.indexOf("Firefox") !== -1) {
        setTimeout(() => {
          sliderValue = objectivesPositions[i][1] + "";
        }, 1);
      } */
    }

    /** Select axis by clicking the axis label */
    plot.on("plotly_click", function (eventData) {
      const objId = eventData.points[0].id;
      if (objId && objId.startsWith("objective label")) {
        const labelIndex = eventData.points[0].pointIndex;

        if (labelIndex > 0 && labelIndex < objectivesPositions.length - 1) {
          selectAxis(labelIndex);
        }
      }
    });

    var slider = document.getElementById("slider") as HTMLInputElement;
    //var sliderValue = document.getElementById("sliderValue") as HTMLSpanElement;
    var dropdown = document.getElementById("dropdown") as HTMLSelectElement;
    var keepDistances = document.getElementById(
      "keepDistances"
    ) as HTMLInputElement;
    var resetButton = document.getElementById("reset") as HTMLButtonElement;
    var datasetsDropdown = document.getElementById(
      "datasets"
    ) as HTMLSelectElement;
    var swapLeft = document.getElementById("swapLeft") as HTMLButtonElement;
    var swapRight = document.getElementById("swapRight") as HTMLButtonElement;

    keepDistances.addEventListener("change", (e) => {
      enableSwapping = e.target.checked;
    });

    swapLeft.addEventListener("click", () => {
      let refAxisIndex = parseInt(dropdown.value) - 1;
      swapAxes(refAxisIndex);
    });

    swapRight.addEventListener("click", () => {
      let refAxisIndex = parseInt(dropdown.value) + 1;
      swapAxes(refAxisIndex);
    });

    /**
     * Swaps the positions of the selected axis with the given axis. Works only
     * for swapping with an axis adjacent to the selected axis.
     *
     * @param refAxisIndex Index of the axis to perform the swap with. Has to be
     *   adjacent to the selected axis.
     */
    function swapAxes(refAxisIndex: number) {
      const axisOrigPos = layout.xaxis.tickvals[parseInt(dropdown.value)];

      const refAxisPosition = objectivesPositions[refAxisIndex][1];
      const refAxisLabel = objectivesPositions[refAxisIndex][0];

      const selectedAxisIndex = parseInt(dropdown.value);
      const selectedAxisLabel = objectivesPositions[selectedAxisIndex][0];

      const newTickVals = [...layout.xaxis.tickvals];
      newTickVals[selectedAxisIndex] = axisOrigPos;

      const updatedTraces = data.map((trace) => {
        // Swap objective labels
        if (trace.mode === "text" && Array.isArray(trace.text)) {
          [trace.text[selectedAxisIndex], trace.text[refAxisIndex]] = [
            trace.text[refAxisIndex],
            trace.text[selectedAxisIndex],
          ];
        }

        // Swap objective axes
        if (trace.name && trace.name.startsWith("Objective axis")) {
          if (trace.name.endsWith(selectedAxisLabel)) {
            trace.x = axisValueHeights.map(() => refAxisPosition);
            return trace;
          }

          if (trace.name.endsWith(refAxisLabel)) {
            trace.x = axisValueHeights.map(() => axisOrigPos);
            return trace;
          }
          // Leave other axes as is
          return trace;
        }

        // Swap bands, solutions and medians positions
        [trace.y[selectedAxisIndex], trace.y[refAxisIndex]] = [
          trace.y[refAxisIndex],
          trace.y[selectedAxisIndex],
        ];

        trace.x = newTickVals;

        return trace;
      });

      // Update state variables accordingly
      [
        objectivesPositions[selectedAxisIndex][0],
        objectivesPositions[refAxisIndex][0],
      ] = [
        objectivesPositions[refAxisIndex][0],
        objectivesPositions[selectedAxisIndex][0],
      ];
      movableObjectives = objectivesPositions.slice(1, -1);

      // Update slider and selected objective accordingly. Keep the objective selected if not swapped with one of the outermost axes.
      if (
        newTickVals[refAxisIndex] <= 0.05 ||
        newTickVals[refAxisIndex] >= 0.95
      ) {
        selectAxis(selectedAxisIndex);
      } else {
        selectAxis(refAxisIndex);
      }

      // Rerender the changes
      let updatedLayout = { ...layout };
      updatedLayout.xaxis.tickvals = newTickVals;
      Plotly.react("SCOREBands", updatedTraces, updatedLayout);

      // Refresh the plot state variables
      data = updatedTraces;
      layout = updatedLayout;
    }

    /* var plotRect = document.querySelector(
      "#SCOREBands > div > div > svg:nth-child(1) > g.bglayer > rect"
    ); */

    // Adjust the slider width to match the plot
    var plotRect = document.querySelector(
      "#SCOREBands > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.gridlayer"
    );

    const rectPosition = plotRect.getBoundingClientRect();

    slider.style.width = rectPosition.width + "px";
    slider.style.left = rectPosition.left + "px";

    /**
     * Reinitializes the plot with the given dataset
     *
     * @param datasetKey
     */
    function reinitialize(datasetKey: string) {
      [data, layout, objectivesPositions] = parseData(datasets[datasetKey]);
      movableObjectives = objectivesPositions.slice(1, -1);
      Plotly.react("SCOREBands", data, layout);
      selectAxis(1);

      plotRect = document.querySelector(
        "#SCOREBands > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.gridlayer"
      );
      const rectPosition = plotRect.getBoundingClientRect();
      slider.style.width = rectPosition.width + "px";
      slider.style.left = rectPosition.left + "px";
    }

    // Handle the plot reset button
    resetButton.addEventListener("click", () => {
      reinitialize(datasetsDropdown.value);
    });

    // Handle the dataset selector
    datasetsDropdown.addEventListener("change", function () {
      reinitialize(this.value);
    });

    /* var axisOrigPos: number;
    slider.addEventListener("mousedown", function () {
      axisOrigPos = layout.xaxis.tickvals[parseInt(dropdown.value)];
    }); */

    slider.addEventListener("input", function () {
      //removeSelectBox();
      /* var [newData, newLayout] = getUpdatedChartData(
        this.value,
        dropdown.value
      );

      Plotly.react("SCOREBands", newData, newLayout); */
      //sliderValue.textContent = parseFloat(slider.value) + "";
    });

    /**
     * Recursively finds the first suitable position for the repositioned axis
     * if the axis is moved within 5% distance of another axis.
     *
     * @param origTickVals
     * @param selectedAxisIndex
     * @param selectedAxisNewPos
     * @param left If true, axis should be moved to the left, otherwise to the
     *   right
     */
    function checkOverlap(
      origTickVals: number[],
      selectedAxisIndex: number,
      selectedAxisNewPos: number,
      left: boolean
    ) {
      for (let i = 0; i < origTickVals.length; i++) {
        if (i === selectedAxisIndex) continue;

        const axisPos = origTickVals[i];

        const dist = parseFloat(
          Math.abs(selectedAxisNewPos - axisPos).toFixed(2)
        );

        if (dist < 0.05) {
          if ((left || i === origTickVals.length - 1) && i !== 0) {
            selectedAxisNewPos = axisPos - 0.05;

            selectedAxisNewPos = checkOverlap(
              origTickVals,
              selectedAxisIndex,
              selectedAxisNewPos,
              true
            );
          } else {
            selectedAxisNewPos = axisPos + 0.05;

            selectedAxisNewPos = checkOverlap(
              origTickVals,
              selectedAxisIndex,
              selectedAxisNewPos,
              false
            );
          }
          break;
        }
      }

      return selectedAxisNewPos;
    }

    /**
     * Updates datatraces and axis position when axis is repositioned with the
     * slider.
     */
    slider.addEventListener("mouseup", function () {
      const origTickVals = [...layout.xaxis.tickvals];
      const selectedAxisIndex = parseInt(dropdown.value);
      const selectedAxisLabel = objectivesPositions[selectedAxisIndex][0];

      let selectedAxisNewPos = parseFloat(this.value);

      // Check if the axis is repositioned too close to another axis and calculate a new position if it is
      for (let i = 0; i < origTickVals.length; i++) {
        if (i === selectedAxisIndex) continue;

        const axisPos = origTickVals[i];

        const left = selectedAxisNewPos < axisPos;
        const dist = parseFloat(
          Math.abs(selectedAxisNewPos - axisPos).toFixed(2)
        );

        if (dist < 0.05) {
          if ((left || i === origTickVals.length - 1) && i !== 0) {
            selectedAxisNewPos = axisPos - 0.05;

            selectedAxisNewPos = checkOverlap(
              origTickVals,
              selectedAxisIndex,
              selectedAxisNewPos,
              true
            );
          } else {
            selectedAxisNewPos = axisPos + 0.05;

            selectedAxisNewPos = checkOverlap(
              origTickVals,
              selectedAxisIndex,
              selectedAxisNewPos,
              false
            );
          }
          break;
        }
      }

      const newTickVals: number[] = [...origTickVals];

      // Calculate the new order and positions of axes
      newTickVals[selectedAxisIndex] = selectedAxisNewPos;
      newTickVals.sort((a, b) => a - b);
      const newPosIndex = newTickVals.indexOf(selectedAxisNewPos);

      // Update all data traces according to the new layout of axes
      const updatedTraces = data.map((trace) => {
        // Reposition the axis label
        if (trace.mode === "text" && Array.isArray(trace.text)) {
          const labelToMove = trace.text[selectedAxisIndex];
          trace.text.splice(selectedAxisIndex, 1);
          trace.text.splice(newPosIndex, 0, labelToMove);
        }
        if (trace.name && trace.name.startsWith("Objective axis")) {
          // Reposition the selected axis
          if (trace.name.endsWith(selectedAxisLabel)) {
            trace.x = axisValueHeights.map(() => selectedAxisNewPos);
            return trace;
          } else {
            // Leave other axes as is
            return trace;
          }
        }

        // Reposition bands, solutions and medians
        const valueToMove = trace.y[selectedAxisIndex];
        trace.y.splice(selectedAxisIndex, 1);
        trace.y.splice(newPosIndex, 0, valueToMove);

        trace.x = newTickVals;
        return trace;
      });

      // Update state variables
      objectivesPositions[selectedAxisIndex][1] = selectedAxisNewPos;
      objectivesPositions = objectivesPositions.sort((a, b) => a[1] - b[1]);
      movableObjectives = objectivesPositions.slice(1, -1);

      // Update the slider and the selected objective if needed (i.e. when axis is moved too close or over another axis)
      selectAxis(newPosIndex);

      // Rerender all changes
      const updatedLayout = { ...layout };
      updatedLayout.xaxis.tickvals = newTickVals;
      Plotly.react("SCOREBands", updatedTraces, updatedLayout);

      // Refresh the plot state variables
      data = updatedTraces;
      layout = updatedLayout;
    });

    dropdown.addEventListener("change", function () {
      selectAxis(parseInt(this.value));
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
    Enable swapping:
    <input type="checkbox" id="keepDistances" checked={enableSwapping} />
    <button hidden={!enableSwapping} id="swapLeft" />
    <button hidden={!enableSwapping} id="swapRight" />
    <button id="reset">Reset</button>
    <br />
    <!-- <span id="sliderValue" hidden>{movableObjectives[0][1]}</span> -->
  </div>
  <div id="plotContainer" style="position: relative;">
    <input
      hidden={enableSwapping}
      type="range"
      id="slider"
      min="0"
      max="1"
      value={sliderValue}
      step="any"
      class="slider"
      on:change={handleChange}
    />
    <div id="SCOREBands" />
  </div>
</div>

<style>
  #swapLeft {
    /* position: absolute; */
    /* top: 25px;
    z-index: 1; */
    width: 0;
    height: 0;
    /* left: 30%; */
    margin-left: 40px;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 20px solid black;
  }

  #swapRight {
    /* position: absolute; */
    /* top: 25px;
    z-index: 1; */
    width: 0;
    height: 0;
    /* left: 40%; */
    margin-left: 50px;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 20px solid black;
  }

  .slider {
    position: absolute;
    top: 35px;
    z-index: 1;
  }

  #reset {
    border: outset;
    border-color: lightgrey;
    float: right;
    padding: 5px;
  }
</style>
