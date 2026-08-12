<template>
  <q-page class="join-prayer-page q-pa-md">
    <div class="join-prayer-card app-raised-section">
      <div v-if="joining" class="text-center q-pa-lg">
        <q-spinner color="primary" size="2em" />
        <div class="text-body2 q-mt-md">Joining shared prayer group...</div>
      </div>

      <template v-else-if="joinedGroupName">
        <q-icon name="groups" color="primary" size="42px" />
        <h1 class="text-h5 q-mt-md q-mb-sm">You joined {{ joinedGroupName }}</h1>
        <p class="text-body2 text-grey-8 q-mb-lg">
          This group is now available from the prayer context menu in the header.
        </p>
        <q-btn color="primary" icon="front_hand" label="Open Prayers" @click="openPrayers" />
      </template>

      <template v-else>
        <q-icon name="link_off" color="negative" size="42px" />
        <h1 class="text-h5 q-mt-md q-mb-sm">Invite link did not work</h1>
        <p class="text-body2 text-grey-8 q-mb-lg">
          The invite code may be incorrect or the shared group may have been removed.
        </p>
        <q-btn flat color="primary" label="Go Home" @click="router.push('/')" />
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useSharedPrayerContextsStore } from 'stores/sharedPrayerContexts'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const sharedPrayerContextsStore = useSharedPrayerContextsStore()

const joining = ref(true)
const joinedGroupName = ref('')

const openPrayers = () => router.push({ path: '/', query: { tab: 'prayers' } })

onMounted(async () => {
  try {
    const joined = await sharedPrayerContextsStore.joinByInviteCode(route.params.inviteCode)
    joinedGroupName.value = joined?.group_name || sharedPrayerContextsStore.activeGroup?.name || 'the group'
    $q.notify({ type: 'positive', message: `Joined ${joinedGroupName.value}` })
  } catch (error) {
    console.error('Error joining shared prayer group:', error)
    $q.notify({ type: 'negative', message: 'Failed to join shared prayer group' })
  } finally {
    joining.value = false
  }
})
</script>

<style scoped>
.join-prayer-page {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.join-prayer-card {
  width: min(100%, 480px);
  margin-top: 24px;
  padding: 28px;
  text-align: center;
}
</style>
