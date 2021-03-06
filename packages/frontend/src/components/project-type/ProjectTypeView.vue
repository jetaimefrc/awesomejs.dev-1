<script>
import PageTitle from '../PageTitle.vue'
import PackageList from '../pkg/PackageList.vue'
import PackageTag from '../pkg/PackageTag.vue'
import ProjectTypeAllTags from './ProjectTypeAllTags.vue'
import ProjectTypeBookmarkButton from './ProjectTypeBookmarkButton.vue'
import ProjectTypePackageProposalsButton from './ProjectTypePackageProposalsButton.vue'

import gql from 'graphql-tag'
import { watch, ref, onUnmounted, computed } from '@vue/composition-api'
import { useQuery, useResult } from '@vue/apollo-composable'
import { projectTypeFragment } from './fragments'
import { setFavicon, resetFavicon } from '@/util/favicon'
import { isSpecialTag } from '@/util/tags'

export default {
  components: {
    PageTitle,
    PackageList,
    PackageTag,
    ProjectTypeAllTags,
    ProjectTypeBookmarkButton,
    ProjectTypePackageProposalsButton,
  },

  props: {
    projectTypeSlug: {
      type: String,
      required: true,
    },

    packageId: {
      type: String,
      default: null,
    },
  },

  setup (props) {
    const { result } = useQuery(gql`
      query ProjectTypeAndPopularTags ($slug: String!) {
        projectType: projectTypeBySlug (slug: $slug) {
          ...projectType
          popularTags {
            id
            count
          }
        }
      }
      ${projectTypeFragment}
    `, () => ({
      slug: props.projectTypeSlug,
    }))
    const projectType = useResult(result)

    // Favicon
    watch(projectType, value => {
      if (value) {
        setFavicon(value.logo)
      }
    })
    onUnmounted(() => {
      resetFavicon()
    })

    // Tags
    const tags = useResult(result, [], data => data.projectType.popularTags)
    const sortedTags = computed(() => tags.value.sort((a, b) => {
      if (isSpecialTag(a.id)) return -1
      if (isSpecialTag(b.id)) return 1
      return 0
    }))
    const selectedTags = ref([])
    function toggleTag (tag) {
      const index = selectedTags.value.indexOf(tag)
      if (index === -1) {
        selectedTags.value.push(tag)
      } else {
        selectedTags.value.splice(index, 1)
      }
    }

    // Scroll to top
    const scroller = ref()
    watch(() => props.packageId, () => {
      scroller.value && (scroller.value.scrollTop = 0)
    })

    return {
      projectType,

      sortedTags,
      selectedTags,
      toggleTag,

      scroller,
    }
  },

  metaInfo () {
    if (!this.projectType) return

    return {
      title: `Awesome ${this.projectType.name} packages`,
    }
  },
}
</script>

<template>
  <div v-if="projectType">
    <template v-if="!$responsive.lg || !packageId">
      <PageTitle
        :back-to="{ name: 'home' }"
        class="mb-4"
      >
        <span v-if="!$responsive.sm">Awesome</span> {{ projectType.name }} packages

        <template #after>
          <ProjectTypeBookmarkButton
            :project-type="projectType"
          />
        </template>
      </PageTitle>

      <div
        v-if="sortedTags.length"
        class="my-2 xl:mt-0 lg:my-4 xl:mb-8 flex flex-wrap justify-stretch -mr-2"
      >
        <i class="material-icons text-gray-600 mr-2 text-xl flex-none">filter_list</i>
        <PackageTag
          v-for="tag of sortedTags"
          :key="tag.id"
          v-tooltip="`${tag.count} package${tag.count > 1 ? 's' : ''}`"
          :tag="tag.id"
          :selected="selectedTags.includes(tag.id)"
          @click="toggleTag(tag.id)"
        />

        <ProjectTypeAllTags
          :project-type-id="projectType.id"
          :selected-tags="selectedTags"
          @select="toggleTag"
        />
      </div>
    </template>

    <div class="flex">
      <div
        v-if="!$responsive.lg || !packageId"
        class="w-full lg:w-1/3 lg:pb-64"
      >
        <ProjectTypePackageProposalsButton
          :project-type-id="projectType.id"
          class="w-full mb-4 sm:mb-6"
        />

        <PackageList
          :project-type-slug="projectType.slug"
          :tags="selectedTags"
        />
      </div>

      <div
        v-if="!$responsive.lg || packageId"
        ref="scroller"
        class="w-full lg:w-2/3 lg:pl-16 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto"
      >
        <router-view
          :project-type-id="projectType.id"
        />
      </div>
    </div>
  </div>
</template>
