<template>
  <a-drawer
    :footer="false"
    :header="false"
    :width="380"
    :visible="visible"
    @ok="handleOk"
    @cancel="handleCancel"
    unmountOnClose
  >
    <div>
      <h2>坐标点</h2>
      <a-textarea
        auto-size
        class="w-full"
        v-model="markerData"
        placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
        allow-clear
      />
      <h2>围栏</h2>
      <a-textarea
        auto-size
        class="w-full"
        v-model="polygonData"
        placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
        allow-clear
      />
      <h2>网格</h2>
      <a-textarea
        auto-size
        class="w-full"
        v-model="gridData"
        placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
        allow-clear
      />
      <h2>热力</h2>
      <a-textarea
        auto-size
        class="w-full"
        v-model="heatData"
        placeholder="输入坐标点，如POINT (115.975944 40.462026)...，可多个"
        allow-clear
      />
      <div class="flex flex-wrap gap-1">
        <a-button @click="handleMarkers">坐标点</a-button>
        <a-button @click="handlePolygon(0)">围栏</a-button>
        <a-button @click="handlePolygon(1)">网格</a-button>
        <a-button @click="handleHeatMap">热力</a-button>
        <a-button @click="clearPolygons">清空</a-button>
      </div>
    </div>
  </a-drawer>
  <div class="fixed z-[999] right-0 top-0 text-text-5 overflow-hidden m-2 rounded-md">
    <a-button type="primary" @click="handleClick">控制</a-button>
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

const visible = ref(false)

const handleClick = () => {
  visible.value = true
}
const handleOk = () => {
  visible.value = false
}
const handleCancel = () => {
  visible.value = false
}

onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: '1086c2f3e379762b8bdc1c546cd8fa32'
  }
  AMapLoader.load({
    key: '99e0c5ea8ef689861a4c4d47701f6f77', // 申请好的Web端开发者Key，首次调用 load 时必填
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

const polygonData = ref(`POINT (115.975944 40.462026)
      POINT (116.8565085214192 40.38811656537166)
      POINT (116.8134796184506 40.36655759357838)`)
// const polygonData = ref('')
const heatData = ref('')
const gridData = ref('')

const handleMarkers = () => {
  if (!markerData.value) {
    Message.warning('啥都不输入，还想生成是吧？给你来一👊')
    return
  }
  const regex = /POINT \((-?\d+\.\d+)\s+(-?\d+\.\d+)\)/g // 正则表达式，匹配POINT记录

  let points = []
  if (regex.test(markerData.value)) {
    let match
    while ((match = regex.exec(markerData.value)) !== null) {
      points.push([parseFloat(match[1]), parseFloat(match[2])]) // 提取匹配的数字并转换为Number类型
    }
  } else {
    points = markerData.value
      .trim()
      .split('\n')
      .map((line) => {
        // 按空格分割每一行，转换为浮点数
        const [x, y] = line.trim().split(' ').map(Number)
        return [x, y] // 返回坐标点的数组
      })
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

function extractCoordinates(pointsString) {
  const regex = /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/g // 正则表达式匹配坐标
  const points = []
  let match
  // 使用 exec 方法提取所有匹配的坐标
  while ((match = regex.exec(pointsString)) !== null) {
    // match[1] 是 x 坐标，match[2] 是 y 坐标
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    points.push([x, y]) // 将坐标点以数组形式添加到结果中
  }

  return points // 返回最终的坐标数组
}

let polygon = null
function handlePolygon(type: number) {
  const fillColor = ['#23C343', '#4080FF'][type]
  const strokeColor = ['#00B42A', '#165DFF'][type]
  const hoverColor = ['#AFF0B5', '#BEDAFF'][type]
  const sourceData = type ? gridData.value : polygonData.value
  if (!sourceData) return
  polygon = new AMap.Polygon({
    path: extractCoordinates(sourceData),
    fillColor,
    strokeOpacity: 1,
    fillOpacity: 0.5,
    strokeColor,
    strokeWeight: 1,
    strokeStyle: 'dashed',
    strokeDasharray: [5, 5]
  })
  polygon.on('mouseover', () => {
    polygon.setOptions({
      fillOpacity: 0.7,
      fillColor: hoverColor
    })
  })
  polygon.on('mouseout', () => {
    polygon.setOptions({
      fillOpacity: 0.5,
      fillColor
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
