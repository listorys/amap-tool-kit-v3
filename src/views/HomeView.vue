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
    <div class="flex flex-col gap-2 !bg-white/20">
      <h2>坐标点</h2>
      <a-textarea class="w-full" v-model="markerData" placeholder="请输入" allow-clear auto-size />
      <a-divider />
      <h2>围栏</h2>
      <a-textarea class="w-full" v-model="polygonData" placeholder="请输入" allow-clear auto-size />
      <a-divider />
      <h2>网格</h2>
      <a-textarea class="w-full" v-model="gridData" placeholder="请输入" allow-clear auto-size />
      <a-divider />
      <h2>热力</h2>
      <a-textarea class="w-full" v-model="heatData" placeholder="请输入" allow-clear auto-size />
      <a-divider />
      <div class="flex flex-wrap justify-around">
        <a-button type="primary" @click="handleMarkers">坐标点</a-button>
        <a-button type="primary" @click="handlePolygon(0)">围栏</a-button>
        <a-button type="primary" @click="handlePolygon(1)">网格</a-button>
        <a-button type="primary" @click="handleHeatMap">热力</a-button>
        <a-button type="outline" @click="clearAll">清空</a-button>
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
import { heatmapData } from '@/const/data'

const visible = ref(false)

// drawer control
const handleClick = () => {
  visible.value = true
}
const handleOk = () => {
  visible.value = false
}
const handleCancel = () => {
  visible.value = false
}

// amap 初始化
let map: any = null
let _AMap: any = null
const initAmap = () => {
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
}

onMounted(() => {
  initAmap()
})

onUnmounted(() => {
  if (map) {
    map.destroy()
    map = null
  }
})

// 标注点
const markerData = ref(``)
// 围栏
const polygonData = ref(``)
// 热力
const heatData = ref('')
const gridData = ref('')

// 控制标注
const handleMarkers = () => {
  if (!markerData.value) {
    Message.warning('啥都不输入，还想生成是吧？给你来一👊')
    return
  }
  clearAll()
  let points = []
  try {
    // 1. 替换 )   POINT ( 为 #
    let str = markerData.value.trim().replace(/\)\s+POINT\s+\(/g, '#')
    // 2. 去掉开头的 POINT ( 和结尾的 )
    str = str.replace(/^POINT\s+\(/, '').replace(/\)$/, '')
    // 3. 按 # 分割并处理每个坐标
    points = str.split('#').map((point) => {
      const [lng, lat] = point.trim().split(/\s+/).map(Number)
      if (!lng || !lat) {
        throw Error
      }
      return [lng, lat]
    })
  } catch (error) {
    Message.warning('标记数据格式错误，仅支持有效的WKT格式，请检查数据')
    points = []
    return
  }

  if (!points?.length) {
    Message.warning('标记数据格式错误，仅支持有效的WKT格式，请检查数据')
    return
  }
  points.forEach((item) => {
    const [lng, lat] = item
    setMarker(new _AMap.LngLat(lng, lat), this)
  })

  function setMarker(position: any, that: any) {
    var marker = new _AMap.Marker({
      position,
      icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
      offset: new _AMap.Pixel(-13, -30)
    })
    map.add(marker)
  }

  map?.setFitView()
}

let heatmap: any = null // 添加热力图层变量
const heatMapData = ref('')
const handleHeatMap = () => {
  clearAll()
  heatmap = new _AMap.HeatMap(map, {
    radius: 25,
    opacity: [0, 0.8]
  })
  heatmap.setDataSet({
    data: heatmapData,
    max: 100
  })
  map?.setFitView()
}

function extractCoordinates(polygonString: string) {
  // 使用正则表达式匹配坐标点
  const regex = /(\d+\.\d+)\s+(\d+\.\d+)/g
  const points = []
  let match

  // 使用 exec 方法提取所有匹配的坐标
  while ((match = regex.exec(polygonString)) !== null) {
    // match[1] 是 x 坐标，match[2] 是 y 坐标
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    points.push([x, y]) // 将坐标点以数组形式添加到结果中
  }

  return points // 返回最终的坐标数组
}

let polygon: any = null
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

const clearAll = () => {
  map?.clearMap()
  if (heatmap) {
    heatmap.setDataSet({
      data: [],
      max: 100
    })
  }
}
</script>

<style lang="stylus" scoped>
#container
  padding 0px
  margin 0px
  width 100%
  height 100vh
</style>
