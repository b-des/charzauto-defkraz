export const getBasePartValue = (value) => String(value ?? '').split('#')[0];

export const getSizeChoices = (node) => {
    if (node?.multichoice !== true || !Array.isArray(node.sizeItems)) {
        return [];
    }

    return node.sizeItems
        .map((item) => ({
            value: String(item?.value ?? ''),
            label: String(item?.label ?? item?.value ?? ''),
        }))
        .filter((item) => item.value.length > 0);
};

export const hasSizeChoices = (node) => getSizeChoices(node).length > 0;

export const hasSelectedSizeChoice = (node, sizeValue) => (
    getSizeChoices(node).some((item) => item.value === String(sizeValue ?? ''))
);

export const getFinalPartValue = (node, nodeValue, itemDetails) => {
    const parentValue = getBasePartValue(nodeValue);

    if (hasSelectedSizeChoice(node, itemDetails?.sizeValue)) {
        return `${itemDetails.sizeValue}${parentValue}`;
    }

    if ((node?.editable === true || node?.multichoice === true) && itemDetails?.value !== undefined) {
        return itemDetails.value;
    }

    return parentValue;
};
