<script setup>
import { defineProps, defineEmits, computed, ref, nextTick } from 'vue';
import FileUpload from './FileUpload.vue';
import { COUNTRIES } from '@/constants/countries';

const props = defineProps({
    id: String,
    label: {
        type: String,
        required: true
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: 'text'
    },
    modelValue: {
        type: [String, Number],
        default: ''
    },
    options: {
        type: Array,
        default: () => []
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'input-change']);

const value = computed({
    get() {
        return props.modelValue;
    },
    set(val) {
        emit('update:modelValue', val);
        emit('input-change', { id: props.id, value: val });
    }
});

const safeOptions = computed(() => {
    return Array.isArray(props.options) ? props.options : [];
});

const countryOpen = ref(false);
const highlightedIndex = ref(-1);
const filteredCountries = computed(() => {
    const q = String(value.value || '').trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.toLowerCase().includes(q));
});

const openCountryList = () => {
    countryOpen.value = true;
    highlightedIndex.value = -1;
};
const closeCountryList = () => {
    // setTimeout lascia spazio al @mousedown della voce prima del blur
    setTimeout(() => { countryOpen.value = false; }, 120);
};
const selectCountry = (country) => {
    value.value = country;
    countryOpen.value = false;
    highlightedIndex.value = -1;
};
const onCountryKeydown = async (e) => {
    if (!countryOpen.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        countryOpen.value = true;
        await nextTick();
    }
    const list = filteredCountries.value;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, list.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
    } else if (e.key === 'Enter') {
        if (highlightedIndex.value >= 0 && list[highlightedIndex.value]) {
            e.preventDefault();
            selectCountry(list[highlightedIndex.value]);
        }
    } else if (e.key === 'Escape') {
        countryOpen.value = false;
    }
};

</script>

<template>
    <div class="input-field">
        <label :for="id">{{ label }} <span v-if="isRequired">*</span></label>
        <template v-if="type === 'select'">
            <select 
                :id="id" 
                :required="isRequired" 
                v-model="value" 
                :disabled="disabled"
                class="form-control"
            >
                <option value="" disabled>Select an option</option>
                <template v-for="option in safeOptions" :key="option.value || option">
                    <option :value="option.value || option">
                        {{ option.label || option }}
                    </option>
                </template>
            </select>
        </template>
        <template v-else-if="type === 'file'">
            <FileUpload v-model="value" />
        </template>
        <template v-else-if="type === 'country'">
            <div class="country-combobox">
                <input
                    type="text"
                    :id="id"
                    :required="isRequired"
                    v-model="value"
                    :disabled="disabled"
                    autocomplete="off"
                    placeholder="Start typing a country..."
                    class="form-control"
                    @focus="openCountryList"
                    @input="openCountryList"
                    @blur="closeCountryList"
                    @keydown="onCountryKeydown"
                />
                <ul v-if="countryOpen && filteredCountries.length" class="country-dropdown">
                    <li
                        v-for="(country, idx) in filteredCountries"
                        :key="country"
                        :class="{ active: idx === highlightedIndex }"
                        @mousedown.prevent="selectCountry(country)"
                        @mouseenter="highlightedIndex = idx"
                    >
                        {{ country }}
                    </li>
                </ul>
                <div v-else-if="countryOpen" class="country-dropdown country-dropdown-empty">
                    No matches
                </div>
            </div>
        </template>
        <template v-else>
            <input
                :type="type"
                :id="id"
                :required="isRequired"
                v-model="value"
                :disabled="disabled"
                class="form-control"
            />
        </template>
    </div>
</template>

<style scoped>
.input-field input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
}
.country-combobox {
    position: relative;
}
.country-dropdown {
    position: absolute;
    z-index: 1000;
    top: 100%;
    left: 0;
    right: 0;
    margin: 4px 0 0;
    padding: 4px 0;
    max-height: 240px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #ced4da;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    list-style: none;
}
.country-dropdown li {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.95rem;
}
.country-dropdown li.active,
.country-dropdown li:hover {
    background: #f1f3f5;
}
.country-dropdown-empty {
    padding: 8px 12px;
    color: #6c757d;
    font-style: italic;
}
</style>
