<template>
  <div class="browse-content">
    <router-view>
      <q-page-transition>
        <keep-alive>
          <div :key="currentView">
            <!-- Main Menu View -->
            <q-list padding v-if="currentView === 'main'">
              <q-item-label header>Harvest Seeds By</q-item-label>

              <q-item clickable v-ripple to="/type/Bible">
                <q-item-section avatar>
                  <q-icon name="auto_stories" />
                </q-item-section>
                <q-item-section>Verses</q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="navigateTo('sermons')">
                <q-item-section avatar>
                  <q-icon name="record_voice_over" />
                </q-item-section>
                <q-item-section>Sermons</q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="navigateTo('books')">
                <q-item-section avatar>
                  <q-icon name="menu_book" />
                </q-item-section>
                <q-item-section>Books</q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="navigateTo('ministries')">
                <q-item-section avatar>
                  <q-icon name="groups" />
                </q-item-section>
                <q-item-section>Ministries</q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="navigateTo('songs')">
                <q-item-section avatar>
                  <q-icon name="music_note" />
                </q-item-section>
                <q-item-section>Song Reflections</q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="navigateTo('podcasts')">
                <q-item-section avatar>
                  <q-icon name="headphones" />
                </q-item-section>
                <q-item-section>Podcasts</q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Sub-menu Views -->
            <q-list padding v-else>
              <!-- Back Button -->
              <q-item clickable v-ripple @click="navigateBack" class="q-mb-md">
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
                <q-item v-for="book in bookResources" :key="book.id" clickable v-ripple
                  :to="'/resource/Book/' + book.id">
                  <q-item-section avatar>
                    <q-icon name="book" />
                  </q-item-section>
                  <q-item-section>{{ book.metadata.title }}</q-item-section>
                </q-item>
              </template>

            </q-list>
          </div>
        </keep-alive>
      </q-page-transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useResourcesStore } from 'src/stores/resources'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const resourcesStore = useResourcesStore()
const currentView = ref('main')

// Resources computed properties
const pastorResources = computed(() => resourcesStore.getResourcesByType('Pastor'))
const bookResources = computed(() => resourcesStore.getResourcesByType('Book'))

const navigateTo = (view) => {
  currentView.value = view
  $q.pageTransition.set({
    name: 'slide-right',
    appear: true,
    duration: 300
  })
}

const navigateBack = () => {
  currentView.value = 'main'
  $q.pageTransition.set({
    name: 'slide-left',
    appear: true,
    duration: 300
  })
}
</script>

<style>
.q-page-transition--slide-right-enter-active,
.q-page-transition--slide-right-leave-active,
.q-page-transition--slide-left-enter-active,
.q-page-transition--slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.q-page-transition--slide-right-enter-from {
  transform: translateX(100%);
}

.q-page-transition--slide-right-leave-to {
  transform: translateX(-100%);
}

.q-page-transition--slide-left-enter-from {
  transform: translateX(-100%);
}

.q-page-transition--slide-left-leave-to {
  transform: translateX(100%);
}
</style>
