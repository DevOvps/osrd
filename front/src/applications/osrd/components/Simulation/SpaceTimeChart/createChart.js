import * as d3 from 'd3';
import { defineLinear, defineTime } from 'applications/osrd/components/Helpers/ChartHelpers';
import defineChart from 'applications/osrd/components/Simulation/defineChart';

export default function createChart(
  chart, chartID, dataSimulation, heightOfSpaceTimeChart, keyValues, ref, reset, rotate,
) {
  d3.select(`#${chartID}`).remove();

  const dataSimulationTime = d3.extent([].concat(...dataSimulation.map(
    (train) => d3.extent([].concat(...train.routeBeginOccupancy.map(
      (section) => d3.extent(section, (step) => step[keyValues[0]]),
    ))),
  )));

  const dataSimulationLinearMax = d3.max([
    d3.max([].concat(...dataSimulation.map(
      (train) => d3.max(train.routeEndOccupancy.map(
        (section) => d3.max(section.map((step) => step[keyValues[1]])),
      )),
    ))),
    d3.max([].concat(...dataSimulation.map(
      (train) => d3.max(train.routeBeginOccupancy.map(
        (section) => d3.max(section.map((step) => step[keyValues[1]])),
      )),
    ))),
  ]);

  const defineX = (chart === undefined || reset)
    ? defineTime(dataSimulationTime, keyValues[0])
    : chart.x;
  const defineY = (chart === undefined || reset)
    ? defineLinear(dataSimulationLinearMax, 0.05)
    : chart.y;

  const width = parseInt(d3.select(`#container-${chartID}`).style('width'), 10);
  const chartLocal = defineChart(
    width, heightOfSpaceTimeChart, defineX, defineY, ref, rotate, keyValues, chartID,
  );
  return (chart === undefined || reset)
    ? chartLocal
    : { ...chartLocal, x: chart.x, y: chart.y };
}
