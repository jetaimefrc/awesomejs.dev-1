<template>
  <div class="p-8 flex flex-col items-center justify-center text-center">
    <i class="material-icons mb-2 text-4xl text-gray-700">filter_list</i>

    <div class="text-gray-600">
      <slot />
    </div>

    <div
      v-if="$slots.cta"
      class="mt-8"
    >
      <slot name="cta" />
    </div>
  </div>
</template>
