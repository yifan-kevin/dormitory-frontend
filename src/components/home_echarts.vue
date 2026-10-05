<template>
  <div ref="chartRef" class="home-chart"></div>
</template>

<script>
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { markRaw } from "vue";
import request from "@/utils/request";

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

export default {
  name: "home_echarts",
  data() {
    return {
      myEcharts: null,
      buildingNames: [],
      studentNums: [],
    };
  },
  mounted() {
    this.createEcharts();
    this.getBuildingNum();
    window.addEventListener("resize", this.resizeChart);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.resizeChart);
    if (this.myEcharts) {
      this.myEcharts.dispose();
      this.myEcharts = null;
    }
  },
  methods: {
    createEcharts() {
      if (!this.$refs.chartRef) {
        return;
      }
      this.myEcharts = markRaw(echarts.init(this.$refs.chartRef, null, {
        renderer: "canvas",
      }));
      this.renderChart();
    },
    resizeChart() {
      if (this.myEcharts && !this.myEcharts.isDisposed()) {
        this.myEcharts.resize();
      }
    },
    renderChart() {
      if (!this.myEcharts || this.myEcharts.isDisposed()) {
        return;
      }

      this.myEcharts.setOption({
        animation: false,
        backgroundColor: "transparent",
        grid: {
          left: 34,
          right: 18,
          top: 34,
          bottom: 34,
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
            shadowStyle: {
              color: "#edf4ef",
            },
          },
          backgroundColor: "#ffffff",
          borderColor: "#e2e7e2",
          textStyle: {
            color: "#26332d",
          },
        },
        xAxis: {
          type: "category",
          data: this.buildingNames,
          axisTick: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: "#e2e7e2",
            },
          },
          axisLabel: {
            color: "#78827b",
            fontWeight: 400,
          },
        },
        yAxis: {
          type: "value",
          splitLine: {
            lineStyle: {
              color: "#edf0ea",
            },
          },
          axisLabel: {
            color: "#78827b",
          },
        },
        series: [
          {
            name: "入住人数",
            type: "bar",
            barWidth: 28,
            data: this.studentNums,
            itemStyle: {
              borderRadius: [3, 3, 0, 0],
              color: "#42735a",
              shadowBlur: 0,
              shadowColor: "transparent",
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 0,
                shadowColor: "transparent",
              },
            },
          },
        ],
      }, true);
    },
    getBuildingNum() {
      request.get("/building/getBuildingName").then((res) => {
        if (res.code !== "0") {
          return;
        }

        this.buildingNames = res.data || [];
        request.get("/room/getEachBuildingStuNum").then((result) => {
          if (result.code !== "0") {
            return;
          }
          this.studentNums = result.data || [];
          this.renderChart();
        });
      });
    },
  },
};
</script>

<style scoped>
.home-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
