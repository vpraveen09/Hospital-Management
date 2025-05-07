<script setup>
defineProps({
    number: {
        type: String,
        required: true,
    },
    iconClass: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <div class="card-container">
        <div class="small-card">
            <div class="card-title">
                <h3 class="title-number">{{ number }}</h3>
                <i :class="iconClass"></i>
            </div>
            <p>Total</p>
            <h5 class="card-desc">{{ description }}</h5>
        </div>
    </div>
</template>


<style scoped>
.card-container {
    display: flex;
    flex-direction: row;
    gap: 12px;
    margin: 10px 0;
}

.small-card {
    padding: 12px;
    border: 1px solid var(--base-border-color);
    border-radius: 6px;
    width: 300px;
    background-color: var(--base-bg);
    color: var(--base-header-row-color);
    height: 130px;
}

.small-card p {
    margin: 0 !important;
}

.card-title {
    margin: 0;
}

/* Title Section Flexbox */
.card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
}

.title-number {
    margin: 0 !important;
}

.card-desc {
    margin: 10px 0;
    font-weight: 900 !important;
    font-size: large !important;
}

@media only screen and (max-width: 768px) {
    .card-container {
        flex-direction: column;
        gap: 16px;
    }

    .small-card {
        width: 99%;
        max-width: 100%;
    }
}
</style>