export function normalizeItems(value: unknown): any[] {
	try {
		if (Array.isArray(value)) {
			return value;
		}
		if (typeof value === "string") {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed)
				? parsed
				: parsed
				? [parsed]
				: [];
		}
		if (value && typeof value === "object") {
			return [value];
		}
	} catch (err) {
		console.warn("normalizeItems: Failed to parse value", value, err);
	}
	return [];
}


