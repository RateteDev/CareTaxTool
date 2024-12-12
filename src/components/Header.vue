<template>
  <header class="header">
    <h1>医療費控除申請支援ツール<span class="version">v1.0.0</span></h1>
    <div class="contact-info">
      <a href="https://github.com/RateteDev/CareTaxTool" target="_blank" class="github-link">
        <i class="fab fa-github"></i>
        RateteDev/CareTaxTool
      </a>
      <a href="mailto:dev@ratete.dev" class="email-link">
        <i class="far fa-envelope"></i>
        dev@ratete.dev
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
// コンポーネントのロジックをここに記述
</script>

<style scoped>
.header {
  background-color: transparent;
  box-shadow: none;
  margin-bottom: 2rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.version {
  font-size: 0.875rem;
  color: #666;
  font-weight: normal;
}

.contact-info {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  flex-wrap: wrap;
}

.github-link, .email-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  text-decoration: none;
  transition: color 0.2s ease;
}

.github-link:hover, .email-link:hover {
  color: var(--primary-color);
}

i {
  font-size: 1rem;
}

@media (max-width: 48rem) { /* 768px */
  .header {
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.25rem;
  }

  .version {
    font-size: 0.75rem;
  }

  .contact-info {
    gap: 1rem;
    font-size: 0.8125rem;
  }

  i {
    font-size: 1rem;
  }
}

@media (max-width: 30rem) { /* 480px */
  .header {
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.125rem;
  }

  .contact-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 