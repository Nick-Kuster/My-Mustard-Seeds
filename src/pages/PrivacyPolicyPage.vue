<template>
  <q-img src="bg.png" class="fixed-full legal-bg" />
  <q-page class="legal-page">
    <article class="legal-card parchment">
      <router-link to="/login" class="legal-back">
        <q-icon name="arrow_back" size="18px" />
        Back to sign in
      </router-link>

      <h1>Privacy Policy</h1>
      <p class="legal-date">Last updated: August 8, 2026</p>

      <p>
        My Mustard Seeds is a private Bible study, journaling, prayer, and testimony app. This policy explains
        what information the app uses, why it is used, and the choices you have.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We collect account information needed to sign you in, such as your email address and authentication
        provider details if you choose Google sign-in. If you enter a first name during onboarding, it is stored
        so the app can personalize your experience.
      </p>
      <p>
        The app also stores the content you choose to save, including journal entries, prayer requests, testimony,
        tags, resources, saved filters, links, quotes, Strong's references, and uploaded images.
      </p>

      <h2>Encrypted Content</h2>
      <p>
        Journal and personal content is encrypted before it is stored. The app is designed so your private notes,
        prayers, and uploaded images are not readable as plain text in the database. Some account and operational
        information, such as your email address, authentication records, timestamps, and non-sensitive settings,
        may need to remain available so the service can function.
      </p>

      <h2>How We Use Information</h2>
      <p>We use your information to provide the app, sign you in, sync your data, secure your account, support imports and exports, improve reliability, and respond to support or deletion requests.</p>

      <h2>Service Providers</h2>
      <p>
        The app uses Supabase for authentication, database, storage, and related backend services. If you use
        Google sign-in, Google processes the authentication information needed to complete that sign-in. These
        providers process information under their own terms and privacy practices.
      </p>

      <h2>Your Choices</h2>
      <p>
        You can export your account data from Settings. You can delete your account from Settings, which permanently
        removes your account and app data from active systems. You may also choose not to use Google sign-in and use
        email-code sign-in instead.
      </p>

      <h2>Data Security</h2>
      <p>
        We use technical safeguards such as authentication, database access controls, encryption for private content,
        and HTTPS connections. No system is perfectly secure, so you should keep access to your email account and
        devices protected.
      </p>

      <h2>Children</h2>
      <p>
        My Mustard Seeds is not intended for children under 13. Do not create an account if you are under 13.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the app changes. The updated version will be posted here with a new last updated
        date.
      </p>

      <h2>Contact</h2>
      <p>
        If you have privacy questions, use the support or contact channel provided with the app.
      </p>
    </article>
  </q-page>
</template>

<style scoped>
.legal-bg {
  opacity: 0.95;
}

.legal-page {
  min-height: 100vh;
  padding: 32px 16px;
}

.legal-card {
  width: min(100%, 820px);
  margin: 0 auto;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(38, 52, 42, 0.2);
}

.legal-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 22px;
  color: var(--q-primary);
  font-weight: 600;
  text-decoration: none;
}

h1 {
  margin: 0 0 6px;
  font-family: Georgia, 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: 2.1rem;
}

h2 {
  margin: 26px 0 8px;
  font-size: 1.15rem;
}

p {
  line-height: 1.65;
}

.legal-date {
  margin-top: 0;
  color: var(--color-text-muted);
}
</style>
