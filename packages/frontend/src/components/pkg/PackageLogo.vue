<script>
import { ref, watch } from '@vue/composition-api'
import genericLogo from '@/assets/package.png'

export default {
  props: {
    pkg: {
      type: Object,
      required: true,
    },
  },

  setup (props) {
    const src = ref(null)

    watch(() => props.pkg.id, id => {
      src.value = null
      const img = new Image()
      img.onload = () => {
        if (id !== props.pkg.id) return
        src.value = img.src
      }
      img.src = `https://unpkg.com/${props.pkg.name}/logo.png`
    })

    function onError () {
      src.value = genericLogo
    }

    return {
      src,
      genericLogo,
      onError,
    }
  },
}
</script>

<template>
  <div class="w-10 h-10 flex items-center justify-center">
    <img
      :src="src || pkg.defaultLogo || genericLogo"
      :alt="`${pkg.name} logo`"
      class="max-w-full max-h-full rounded overflow-hidden"
      @error="onError()"
    >
  </div>
</template>
