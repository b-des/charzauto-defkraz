export const getBasePartValue = (value) => String(value ?? '').split('#')[0];

export const getSizeChoices = (node) => {
    if (node?.multichoice !== true || !Array.isArray(node.sizeItems)) {
        return [];
    }

    return node.sizeItems
        .map((item) => ({
            ...(item && typeof item === 'object' ? item : {}),
            value: String(item?.value ?? ''),
            label: String(item?.label ?? item?.value ?? ''),
        }))
        .filter((item) => item.value.length > 0);
};

export const hasSizeChoices = (node) => getSizeChoices(node).length > 0;

export const createSelectablePartsTree = (nodes) => (nodes || []).map((node) => {
    const children = createSelectablePartsTree(node.children || []);
    const sizeChoices = getSizeChoices(node);

    if (sizeChoices.length === 0) {
        return children.length > 0 ? {...node, children} : node;
    }

    const parentValue = String(node.value ?? '');
    const parentLabel = String(node.label ?? getBasePartValue(parentValue));
    const choiceNodes = sizeChoices.map((item, index) => ({
        ...item,
        value: `${item.value}#size:${parentValue}:${index}`,
        submittedValue: item.value,
        selectionLabel: `${parentLabel} — ${item.label}`,
        choiceGroupValue: parentValue,
        isSizeChoice: true,
        editable: false,
        multichoice: false,
    }));

    return {...node, children: [...children, ...choiceNodes]};
});

export const getFinalPartValue = (node, nodeValue, itemDetails) => {
    const parentValue = getBasePartValue(nodeValue);

    if (node?.isSizeChoice === true) {
        return String(node.submittedValue ?? parentValue);
    }

    if ((node?.editable === true || node?.multichoice === true) && itemDetails?.value !== undefined) {
        return itemDetails.value;
    }

    return parentValue;
};
