<template>
  <header class="header">
    <div class="title-row">
      <h1>医療費控除申請支援ツール<span class="version">v1.0.0</span></h1>
      <div class="links">
        <a href="https://github.com/RateteDev/CareTaxTool" target="_blank" class="github-link">
          <i class="fab fa-github"></i>
          RateteDev/CareTaxTool
        </a>
        <a href="mailto:dev@ratete.dev" class="email-link">
          <i class="far fa-envelope"></i>
          dev@ratete.dev
        </a>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// コンポーネントのロジックをここに記述
</script>

<style scoped>
.header {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  padding: 1rem;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: 1.2rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.version {
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
}

.links {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.github-link, .email-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  text-decoration: none;
}

.github-link:hover, .email-link:hover {
  color: #333;
}

i {
  font-size: 1rem;
}
</style> 