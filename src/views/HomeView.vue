<template>
  <div
    class="fixed !w-[300px] z-[999] flex flex-col gap-2 p-3 right-0 top-0 text-text-5 bg-text-4/5 hover:bg-text-4/15 overflow-hidden m-2 rounded-md"
  >
    <h2>坐标点</h2>
    <a-textarea
      class="w-full min-h-[130px]"
      v-model="markerData"
      placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
      allow-clear
    />
    <h2>围栏</h2>
    <a-textarea
      class="w-full min-h-[130px]"
      v-model="polygonData"
      placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
      allow-clear
    />
    <h2>热力</h2>
    <a-textarea
      class="w-full min-h-[130px]"
      v-model="heatData"
      placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
      allow-clear
    />
    <h2>网格</h2>
    <a-textarea
      class="w-full min-h-[130px]"
      v-model="gridData"
      placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
      allow-clear
    />
    <div class="flex gap-1 flex-wrap">
      <a-button @click="handleMarkers">坐标点</a-button>
      <a-button @click="handlePolygon">围栏</a-button>
      <a-button @click="handleHeatMap">热力</a-button>
      <a-button>网格</a-button>
      <a-button @click="clearPolygons">清空</a-button>
    </div>
  </div>
  <div id="container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { Message } from '@arco-design/web-vue'
import { heatmapData, shanghai } from '@/const/data'

let map = null
let _AMap = null

onMounted(() => {
  // window._AMapSecurityConfig = {
  //   securityJsCode: '17d84e048fb846408c042b3cc3bbd7e4'
  // }
  AMapLoader.load({
    key: '17d84e048fb846408c042b3cc3bbd7e4', // 申请好的Web端开发者Key，首次调用 load 时必填
    version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: ['AMap.Scale', 'AMap.HeatMap'], //需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['...','...']
    Loca: {
      // 是否加载 Loca， 缺省不加载
      version: '2.0.0' // Loca 版本，缺省 1.3.2
    }
  })
    .then((AMap) => {
      _AMap = AMap
      map = new AMap.Map('container', {
        // 设置地图容器id
        viewMode: '3D', // 是否为3D地图模式
        mapStyle: 'amap://styles/whitesmoke',
        zoom: 11 // 初始化地图级别
        // center: [116.397428, 39.90923] // 初始化地图中心点位置
      })
    })
    .catch((e) => {
      console.log(e)
    })
})

onUnmounted(() => {
  map?.destroy()
})

const markerData = ref(`POINT (115.975944 40.462026)
      POINT (116.8565085214192 40.38811656537166)
      POINT (116.8134796184506 40.36655759357838)`)

const polygonData = ref('')
const heatData = ref('')
const gridData = ref('')

const handleMarkers = () => {
  if (!markerData.value) {
    Message.warning('啥都不输入，还想生成是吧？给你来一👊')
    return
  }
  const regex = /POINT \((-?\d+\.\d+)\s+(-?\d+\.\d+)\)/g // 正则表达式，匹配POINT记录

  const points = []
  let match
  while ((match = regex.exec(markerData.value)) !== null) {
    points.push([parseFloat(match[1]), parseFloat(match[2])]) // 提取匹配的数字并转换为Number类型
  }

  if (!points?.length) {
    Message.warning('标记数据格式错误，请输入有效的WKT格式')
    return
  }
  points.forEach((item) => {
    const [lng, lat] = item
    setMarker(new _AMap.LngLat(lng, lat), this)
  })
  function setMarker(position, that) {
    var marker = new _AMap.Marker({
      position,
      icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
      offset: new _AMap.Pixel(-13, -30)
    })
    map.add(marker)
  }
  map?.setFitView()
}

const heatMapData = ref('')
const handleHeatMap = () => {
  const heatmap = new _AMap.HeatMap(map, {
    radius: 25, //给定半径
    opacity: [0, 0.8]
    /*,
            gradient:{
                0.5: 'blue',
                0.65: 'rgb(117,211,248)',
                0.7: 'rgb(0, 255, 0)',
                0.9: '#ffea00',
                1.0: 'red'
            }
             */
  })
  //设置数据集：该数据为北京部分“公园”数据
  heatmap.setDataSet({
    data: heatmapData,
    max: 100
  })
  map?.setFitView()
}

function handlePolygon() {
  let polygon = new AMap.Polygon({
    path: shanghai,
    fillColor: '#ccebc5',
    strokeOpacity: 1,
    fillOpacity: 0.5,
    strokeColor: '#2b8cbe',
    strokeWeight: 1,
    strokeStyle: 'dashed',
    strokeDasharray: [5, 5]
  })
  polygon.on('mouseover', () => {
    polygon.setOptions({
      fillOpacity: 0.7,
      fillColor: '#7bccc4'
    })
  })
  polygon.on('mouseout', () => {
    polygon.setOptions({
      fillOpacity: 0.5,
      fillColor: '#ccebc5'
    })
  })
  map.add(polygon)
  map?.setFitView()
}

const clearPolygons = () => {
  map?.clearMap()
}
</script>

<style lang="stylus" scoped>
#container
  padding 0px
  margin 0px
  width 100%
  height 100vh
</style>
