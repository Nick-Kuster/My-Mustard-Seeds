<template>
  <q-img src="bg.png" class="fixed-full legal-bg" />
  <q-page class="legal-page">
    <article class="legal-card parchment">
      <router-link to="/login" class="legal-back">
        <q-icon name="arrow_back" size="18px" />
        Back to sign in
      </router-link>

      <h1>Terms of Service</h1>
      <p class="legal-date">Last updated: August 8, 2026</p>

      <p>
        These Terms govern your use of My Mustard Seeds, a private Bible study, journaling, prayer, and testimony
        app. By creating an account or using the app, you agree to these Terms.
      </p>

      <h2>Your Account</h2>
      <p>
        You are responsible for keeping access to your email account, devices, and sign-in methods secure. You agree
        to provide accurate account information and to use the app only for lawful purposes.
      </p>

      <h2>Your Content</h2>
      <p>
        You keep ownership of the notes, prayers, testimony, resources, images, tags, and other content you add to
        the app. You give the app permission to store, process, encrypt, sync, display, import, and export your
        content as needed to provide the service.
      </p>

      <h2>Private Journaling and Encryption</h2>
      <p>
        The app is designed to encrypt private journal and prayer content before storage. You understand that no
        technical system is perfect, and some account, authentication, routing, timestamp, and operational data may
        remain unencrypted because it is needed for the service to work.
      </p>

      <h2>Imports, Exports, and AI Tools</h2>
      <p>
        The app may provide templates that help you use an AI assistant to format old notes for import. You are
        responsible for reviewing imported content before relying on it. Exports are provided so you can keep your
        own copy of your data.
      </p>

      <h2>Acceptable Use</h2>
      <p>
        Do not use the app to break the law, harm others, attempt unauthorized access, interfere with the service,
        upload malicious files, or store content that you do not have the right to store.
      </p>

      <h2>Faith and Personal Reflection</h2>
      <p>
        My Mustard Seeds is a journaling and study tool. It does not provide professional counseling, medical advice,
        legal advice, financial advice, or pastoral authority. You are responsible for your own decisions and should
        seek appropriate help when needed.
      </p>

      <h2>Service Changes</h2>
      <p>
        Features may change over time. We may modify, suspend, or discontinue parts of the app when needed for
        maintenance, security, reliability, or product changes.
      </p>

      <h2>Account Deletion</h2>
      <p>
        You may delete your account from Settings. Deletion permanently removes your account and app data from active
        systems, so you should export anything you want to keep before deleting your account.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The app is provided "as is" and "as available." We do not promise that it will be uninterrupted, error-free,
        or fit for every purpose. To the fullest extent allowed by law, we disclaim implied warranties.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        To the fullest extent allowed by law, we are not liable for indirect, incidental, special, consequential, or
        punitive damages, or for loss of data, profits, or goodwill arising from your use of the app.
      </p>

      <h2>Changes to These Terms</h2>
      <p>
        We may update these Terms as the app changes. The updated version will be posted here with a new last updated
        date. Continued use of the app after changes means you accept the updated Terms.
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
