<!-- NavigationDrawer.vue -->
<template>
  <q-drawer :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)" :mini="miniState" bordered
    :breakpoint="1023" :width="250" class="bg-white">
    <q-scroll-area class="fit">
      <q-list padding>
        <!-- Main Menu Items -->
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

        <!-- Harvest Seeds Section -->
        <q-item-label header>Harvest Seeds By</q-item-label>

        <!-- Bible Verses - Basic Link for now -->
        <q-item clickable v-ripple to="/type/Bible">
          <q-item-section avatar>
            <q-icon name="auto_stories" />
          </q-item-section>
          <q-item-section>Verses</q-item-section>
        </q-item>

        <!-- Sermons Expansion Item -->
        <q-expansion-item icon="record_voice_over" label="Sermons" :content-inset-level="0.5">
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
        </q-expansion-item>

        <!-- Books Expansion Item -->
        <q-expansion-item icon="menu_book" label="Books" :content-inset-level="0.5">
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
        </q-expansion-item>

        <!-- Ministry Expansion Item -->
        <q-expansion-item icon="groups" label="Ministries" :content-inset-level="0.5">
          <q-item clickable v-ripple to="/resource/SongArtist" class="bg-grey-2">
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
        </q-expansion-item>

        <!-- Songs Expansion Item -->
        <q-expansion-item icon="music_note" label="Song Reflections" :content-inset-level="0.5">
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
        </q-expansion-item>

        <!-- Podcasts Expansion Item -->
        <q-expansion-item icon="headphones" label="Podcasts" :content-inset-level="0.5">
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
        </q-expansion-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResourcesStore } from 'src/stores/resources'

const miniState = ref(false)
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

// Load resources when component mounts
onMounted(async () => {
  try {
    await resourcesStore.loadResources()
  } catch (error) {
    console.error('Error loading resources:', error)
  }
})
</script>
