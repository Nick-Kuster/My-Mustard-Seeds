<!-- NavigationDrawer.vue -->
<template>
  <q-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :mini="miniState"
    bordered :breakpoint="1023" :width="250" class="bg-white">
    <q-scroll-area class="fit">
      <!-- Main Menu View -->
      <q-transition enter-active-class="animated slideInRight" leave-active-class="animated slideOutLeft">
        <q-list padding v-if="currentView === 'main'">
          <q-item-label header>Menu</q-item-label>

          <q-item clickable v-ripple to="/" exact>
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>Home</q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/entry/new">
            <q-item-section avatar>
              <q-icon name="agriculture" />
            </q-item-section>
            <q-item-section>Plant a Seed</q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label header>Harvest Seeds By</q-item-label>

          <q-item clickable v-ripple to="/type/Bible">
            <q-item-section avatar>
              <q-icon name="auto_stories" />
            </q-item-section>
            <q-item-section>Verses</q-item-section>
          </q-item>

          <!-- Category items that lead to sub-menus -->
          <q-item clickable v-ripple @click="showSubMenu('sermons')">
            <q-item-section avatar>
              <q-icon name="record_voice_over" />
            </q-item-section>
            <q-item-section>Sermons</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="showSubMenu('books')">
            <q-item-section avatar>
              <q-icon name="menu_book" />
            </q-item-section>
            <q-item-section>Books</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="showSubMenu('ministries')">
            <q-item-section avatar>
              <q-icon name="groups" />
            </q-item-section>
            <q-item-section>Ministries</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="showSubMenu('songs')">
            <q-item-section avatar>
              <q-icon name="music_note" />
            </q-item-section>
            <q-item-section>Song Reflections</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="showSubMenu('podcasts')">
            <q-item-section avatar>
              <q-icon name="headphones" />
            </q-item-section>
            <q-item-section>Podcasts</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-transition>

      <!-- Sub-menu Views -->
      <q-transition enter-active-class="animated slideInRight" leave-active-class="animated slideOutLeft">
        <q-list padding v-if="currentView !== 'main'">
          <!-- Back Button -->
          <q-item clickable v-ripple @click="currentView = 'main'" class="bg-grey-2">
            <q-item-section avatar>
              <q-icon name="arrow_back" />
            </q-item-section>
            <q-item-section>Back to Menu</q-item-section>
          </q-item>

          <q-separator spaced />

          <!-- Sermons Sub-menu -->
          <template v-if="currentView === 'sermons'">
            <q-item-label header>Sermons</q-item-label>
            <q-item clickable v-ripple to="/resource/Pastor" class="bg-grey-2">
              <q-item-section avatar>
                <q-icon name="grid_view" />
              </q-item-section>
              <q-item-section>View All Sermons</q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item v-for="pastor in pastorResources" :key="pastor.id" clickable v-ripple
              :to="'/resource/Pastor/' + pastor.id">
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>{{ pastor.metadata.name }}</q-item-section>
            </q-item>
          </template>

          <!-- Books Sub-menu -->
          <template v-if="currentView === 'books'">
            <q-item-label header>Books</q-item-label>
            <q-item clickable v-ripple to="/resource/Book" class="bg-grey-2">
              <q-item-section avatar>
                <q-icon name="grid_view" />
              </q-item-section>
              <q-item-section>View All Books</q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item v-for="book in bookResources" :key="book.id" clickable v-ripple :to="'/resource/Book/' + book.id">
              <q-item-section avatar>
                <q-icon name="book" />
              </q-item-section>
              <q-item-section>{{ book.metadata.title }}</q-item-section>
            </q-item>
          </template>

          <!-- Ministries Sub-menu -->
          <template v-if="currentView === 'ministries'">
            <q_item-label header>Ministries</q_item-label>
            <q-item clickable v-ripple to="/resource/Ministry" class="bg-grey-2">
              <q-item-section avatar>
                <q-icon name="grid_view" />
              </q-item-section>
              <q-item-section>View All Ministries</q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item v-for="ministry in ministryResources" :key="ministry.id" clickable v-ripple
              :to="'/resource/Ministry/' + ministry.id">
              <q-item-section avatar>
                <q-icon name="volunteer_activism" />
              </q-item-section>
              <q-item-section>{{ ministry.metadata.name }}</q-item-section>
            </q-item>
          </template>

          <!-- Songs Sub-menu -->
          <template v-if="currentView === 'songs'">
            <q-item-label header>Song Reflections</q-item-label>
            <q-item clickable v-ripple to="/resource/SongArtist" class="bg-grey-2">
              <q-item-section avatar>
                <q-icon name="grid_view" />
              </q-item-section>
              <q-item-section>View All Songs</q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item v-for="artist in songArtistResources" :key="artist.id" clickable v-ripple
              :to="'/resource/SongArtist/' + artist.id">
              <q-item-section avatar>
                <q-icon name="mic" />
              </q-item-section>
              <q-item-section>{{ artist.metadata.name }}</q-item-section>
            </q-item>
          </template>

          <!-- Podcasts Sub-menu -->
          <template v-if="currentView === 'podcasts'">
            <q-item-label header>Podcasts</q-item-label>
            <q-item clickable v-ripple to="/resource/Podcast" class="bg-grey-2">
              <q-item-section avatar>
                <q-icon name="grid_view" />
              </q-item-section>
              <q-item-section>View All Podcasts</q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item v-for="podcast in podcastResources" :key="podcast.id" clickable v-ripple
              :to="'/resource/Podcast/' + podcast.id">
              <q-item-section avatar>
                <q-icon name="podcasts" />
              </q-item-section>
              <q-item-section>{{ podcast.metadata.title }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-transition>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResourcesStore } from 'src/stores/resources'

const miniState = ref(false)
const currentView = ref('main')
const resourcesStore = useResourcesStore()

// Computed properties for different resource types
const pastorResources = computed(() =>
  resourcesStore.getResourcesByType('Pastor')
)

const bookResources = computed(() =>
  resourcesStore.getResourcesByType('Book')
)

const ministryResources = computed(() =>
  resourcesStore.getResourcesByType('Ministry')
)

const songArtistResources = computed(() =>
  resourcesStore.getResourcesByType('SongArtist')
)

const podcastResources = computed(() =>
  resourcesStore.getResourcesByType('Podcast')
)

const showSubMenu = (menuType) => {
  currentView.value = menuType
}

// Load resources when component mounts
onMounted(async () => {
  try {
    await resourcesStore.loadResources()
  } catch (error) {
    console.error('Error loading resources:', error)
  }
})
</script>

<style>
/* Animation classes */
.animated {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}

@keyframes slideInRight {
  from {
    transform: translate3d(100%, 0, 0);
    visibility: visible;
  }

  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes slideOutLeft {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    visibility: hidden;
    transform: translate3d(-100%, 0, 0);
  }
}

.slideInRight {
  animation-name: slideInRight;
}

.slideOutLeft {
  animation-name: slideOutLeft;
}
</style>
