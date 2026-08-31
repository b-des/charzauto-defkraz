import {useState, useCallback, useMemo, useRef} from 'react';

import '@fortawesome/fontawesome-free/css/all.css';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    CircularProgress,
    Grid,
    Snackbar,
    Typography
} from "@mui/material";
import VehicleParametersBar from "./components/VehicleParametersBar.jsx";
import PartsFilter from "./components/PartsFilter.jsx";
import PartsTree from "./components/PartsTree.jsx";
import SelectedPartsList from "./components/SelectedPartsList.jsx";
import VehicleChangeConfirmDialog from "./components/VehicleChangeConfirmDialog.jsx";
import PartDetailsDialog from "./components/PartDetailsDialog.jsx";
import NewPartDialog from "./components/NewPartDialog.jsx";
import RestoreOrderDialog from "./components/RestoreOrderDialog.jsx";
import {sendDefect} from "./api/orderApi.js";
import {ArrowCircleDown} from "@mui/icons-material";
import PullToRefresh from "react-simple-pull-to-refresh";
import {
    createSelectablePartsTree,
    getFinalPartValue,
    hasSizeChoices
} from "./utils/partValue.js";
import {useVehicles} from "./hooks/useVehicles.js";

const STORAGE_KEY_PREFIX = 'defkraz_order_';
const DRAFT_STORAGE_KEY = `${STORAGE_KEY_PREFIX}draft`;
const MANUAL_PARTS_GROUP_VALUE = '__manual_parts__';


const buildNodeMap = (treeNodes) => {
    const nodeMap = new Map();

    const visitNode = (node) => {
        if (node.value) {
            nodeMap.set(node.value, node);
        }

        (node.children || []).forEach(visitNode);
    };

    treeNodes.forEach(visitNode);

    return nodeMap;
};

const getNodeQuantity = (node) => {
    const quantity = Number(node?.quantity);

    return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
};

const restoreSelectableParts = (checkedValues, storedFlags, nodeByValue) => {
    const checked = [];
    const itemFlags = {};

    (checkedValues || []).forEach((value) => {
        const node = nodeByValue.get(value);
        const details = storedFlags?.[value];
        let restoredValue = value;

        if (hasSizeChoices(node)) {
            const selectedSizeValue = String(details?.sizeValue ?? '');
            const selectedSizeNode = (node.children || []).find((child) => (
                child.isSizeChoice === true
                && child.submittedValue === selectedSizeValue
            ));

            if (!selectedSizeNode) return;
            restoredValue = selectedSizeNode.value;
        }

        if (!checked.includes(restoredValue)) checked.push(restoredValue);
        if (details) {
            const restoredDetails = {...details};
            delete restoredDetails.sizeValue;
            itemFlags[restoredValue] = restoredDetails;
        }
    });

    return {checked, itemFlags};
};

// Add commonly used order numbers here; users can also add values from the selector.
const orderNumberOptions = [];

function VehicleRepairComponent() {
    const {vehicles, isLoading: vehiclesLoading, error: vehiclesError} = useVehicles();
    const [vehicle, setVehicle] = useState('');
    const [checked, setChecked] = useState([]);
    const [expanded, setExpanded] = useState([]);
    const [chassisNumber, setChassisNumber] = useState('');
    const [engineNumber, setEngineNumber] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [filterText, setFilterText] = useState('');
    const [itemFlags, setItemFlags] = useState({});
    const [pendingVehicle, setPendingVehicle] = useState('');
    const [vehicleChangeDialogOpen, setVehicleChangeDialogOpen] = useState(false);

    const [partDialogOpen, setPartDialogOpen] = useState(false);
    const [pendingPartValue, setPendingPartValue] = useState(null);
    const [isEditingExistingPart, setIsEditingExistingPart] = useState(false);
    const [newPartDialogOpen, setNewPartDialogOpen] = useState(false);
    const [customParts, setCustomParts] = useState({});

    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [savedOrderData, setSavedOrderData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitNotification, setSubmitNotification] = useState(null);
    const [showParameterValidation, setShowParameterValidation] = useState(false);
    const orderNumberDebounceRef = useRef(null);

    const [isErrorDismissed, setIsErrorDismissed] = useState(false);

    const selectedVehicle = vehicle || vehicles[0]?.value || '';
    const parameterErrors = {
        vehicle: !selectedVehicle.trim(),
        orderNumber: !orderNumber.trim(),
        chassisNumber: !chassisNumber.trim(),
        engineNumber: !engineNumber.trim(),
    };
    const hasParameterErrors = Object.values(parameterErrors).some(Boolean);
    const vehicleNodes = useMemo(
        () => createSelectablePartsTree(
            vehicles.find((item) => item.value === selectedVehicle)?.nodes ?? []
        ),
        [vehicles, selectedVehicle]
    );
    const nodes = useMemo(() => ([
        ...vehicleNodes,
        {
            value: MANUAL_PARTS_GROUP_VALUE,
            label: 'Ручне введення',
            children: Object.values(customParts),
        },
    ]), [customParts, vehicleNodes]);
    const nodeByValue = useMemo(() => buildNodeMap(nodes), [nodes]);

    const onVehicleChange = useCallback((e) => {
        const nextVehicle = e.target.value;

        if (checked.length > 0) {
            setPendingVehicle(nextVehicle);
            setVehicleChangeDialogOpen(true);
            return;
        }

        setVehicle(nextVehicle);
        setChecked([]);
        setExpanded([]);
        setItemFlags({});
        setCustomParts({});
    }, [checked.length]);

    const clearSelectionState = useCallback(() => {
        setChecked([]);
        setExpanded([]);
        setItemFlags({});
        setCustomParts({});
    }, []);

    const handleVehicleChangeCancel = useCallback(() => {
        setVehicleChangeDialogOpen(false);
        setPendingVehicle('');
    }, []);

    const handleVehicleChangeConfirm = useCallback(() => {
        if (pendingVehicle) {
            setVehicle(pendingVehicle);
            clearSelectionState();
        }

        setVehicleChangeDialogOpen(false);
        setPendingVehicle('');
    }, [clearSelectionState, pendingVehicle]);

    const onCheck = useCallback((checkedValues) => {
        const newValues = checkedValues.filter(v => !checked.includes(v));

        if (newValues.length > 0) {
            const selectedValue = newValues[0];
            const choiceGroupValue = nodeByValue.get(selectedValue)?.choiceGroupValue;
            const nextCheckedValues = choiceGroupValue
                ? checkedValues.filter((value) => (
                    value === selectedValue
                    || nodeByValue.get(value)?.choiceGroupValue !== choiceGroupValue
                ))
                : checkedValues;

            setPendingPartValue(selectedValue);
            setIsEditingExistingPart(false);
            setPartDialogOpen(true);
            setChecked(nextCheckedValues);
            setItemFlags((current) => {
                const next = {};
                nextCheckedValues.forEach((value) => {
                    if (current[value]) next[value] = current[value];
                });
                return next;
            });
        } else {
            setChecked(checkedValues);
            setItemFlags((current) => {
                const next = {};
                checkedValues.forEach(v => {
                    if (current[v]) next[v] = current[v];
                });
                return next;
            });
        }
    }, [checked, nodeByValue]);

    const onSelectedItemToggle = useCallback((value) => {
        setChecked((current) => current.filter(v => v !== value));
        setItemFlags((current) => {
            const next = {...current};
            delete next[value];
            return next;
        });
        setCustomParts((current) => {
            if (!current[value]) return current;
            const next = {...current};
            delete next[value];
            return next;
        });
    }, []);

    const handleNewPartApply = useCallback((values) => {
        const value = `${values.catalogNumber}#custom-${crypto.randomUUID()}`;
        const node = {value, label: values.partName, quantity: values.quantity, isCustom: true};

        setCustomParts((current) => ({...current, [value]: node}));
        setChecked((current) => [...current, value]);
        setItemFlags((current) => ({
            ...current,
            [value]: {replace: values.replace, repair: values.repair, missing: values.missing},
        }));
        setExpanded((current) => current.includes(MANUAL_PARTS_GROUP_VALUE)
            ? current
            : [...current, MANUAL_PARTS_GROUP_VALUE]);
        setFilterText('');
        setNewPartDialogOpen(false);
    }, []);

    const handlePartDialogApply = useCallback((values) => {
        setItemFlags((current) => ({
            ...current,
            [pendingPartValue]: {
                replace: values.replace,
                repair: values.repair,
                missing: values.missing,
                ...(values.value !== undefined && {value: values.value}),
            }
        }));
        setPartDialogOpen(false);
        setPendingPartValue(null);
    }, [pendingPartValue]);

    const handlePartDialogCancel = useCallback(() => {
        if (!isEditingExistingPart) {
            setChecked((current) => current.filter(v => v !== pendingPartValue));
        }
        setPartDialogOpen(false);
        setPendingPartValue(null);
    }, [isEditingExistingPart, pendingPartValue]);

    const handleEditItem = useCallback((value) => {
        setPendingPartValue(value);
        setIsEditingExistingPart(true);
        setPartDialogOpen(true);
    }, []);

    const onExpand = useCallback((expandedValues) => {
        setExpanded(expandedValues);
    }, []);

    const onOrderNumberChange = useCallback((e) => {
        const value = e.target.value;
        setOrderNumber(value);

        if (orderNumberDebounceRef.current) {
            clearTimeout(orderNumberDebounceRef.current);
        }

        if (!value.trim()) return;

        orderNumberDebounceRef.current = setTimeout(() => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY_PREFIX + value.trim());
                if (stored && checked.length === 0) {
                    const data = JSON.parse(stored);
                    setSavedOrderData(data);
                    setRestoreDialogOpen(true);
                }
            } catch { /* ignore parse errors */
            }
        }, 500);
    }, [checked.length]);

    const handleRestoreOrder = useCallback(() => {
        if (savedOrderData) {
            const restoredNodes = createSelectablePartsTree(
                vehicles.find((item) => item.value === savedOrderData.vehicle)?.nodes ?? []
            );
            const restored = restoreSelectableParts(
                savedOrderData.checked,
                savedOrderData.itemFlags,
                buildNodeMap(restoredNodes)
            );

            setVehicle(savedOrderData.vehicle);
            setChecked(restored.checked);
            setItemFlags(restored.itemFlags);
            setCustomParts(savedOrderData.customParts ?? {});
            setChassisNumber(savedOrderData.chassisNumber ?? '');
            setEngineNumber(savedOrderData.engineNumber ?? '');
        }
        setRestoreDialogOpen(false);
        setSavedOrderData(null);
    }, [savedOrderData, vehicles]);

    const handleDiscardRestore = useCallback(() => {
        setRestoreDialogOpen(false);
        setSavedOrderData(null);
    }, []);

    const onFilterChange = useCallback((e) => {
        setFilterText(e.target.value);
    }, []);

    const onSubmit = useCallback(async () => {
        const selectableChecked = checked.filter((value) => !hasSizeChoices(nodeByValue.get(value)));
        const selectedItems = selectableChecked.map((value) => {
            const node = nodeByValue.get(value);
            const flags = itemFlags[value] ?? {replace: 0, repair: 0, missing: 0};

            return {
                "value": getFinalPartValue(node, value, flags),
                label: node?.selectionLabel ?? node?.label ?? value.split('#')[0],
                quantity: getNodeQuantity(node),
                replace: flags.replace,
                repair: flags.repair,
                missing: flags.missing,
            };
        });

        const stateToSave = {
            vehicle: selectedVehicle,
            checked: selectableChecked,
            itemFlags,
            customParts,
            chassisNumber,
            engineNumber,
        };
        try {
            const storageKey = orderNumber.trim()
                ? STORAGE_KEY_PREFIX + orderNumber.trim()
                : DRAFT_STORAGE_KEY;
            localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        } catch { /* ignore quota errors */
        }


        const dataToSend = {model: selectedVehicle, selectedItems, orderNumber, engineNumber, chassisNumber};
        console.log(JSON.stringify(dataToSend))

        setShowParameterValidation(true);
        if (hasParameterErrors) {
            setSubmitNotification({
                severity: 'warning',
                message: 'Чернетку збережено локально. Заповніть усі параметри перед відправленням.'
            });
            return;
        }

        try {
            setIsSubmitting(true);
            var result = await sendDefect(dataToSend);
            if (!result.documentRef) {
                setSubmitNotification({severity: 'error', message: 'Помилка при створенні дефектовки.'});
            } else {
                setSubmitNotification({severity: 'success', message: 'Дефектовку успішно відправлено.'});
            }
        } catch (error) {
            console.error('Не вдалося відправити дефектовку.', error);
            setSubmitNotification({severity: 'error', message: 'Не вдалося відправити дефектовку. Спробуйте ще раз.'});
        } finally {
            setIsSubmitting(false);
        }
    }, [checked, orderNumber, selectedVehicle, chassisNumber, engineNumber, itemFlags, customParts, nodeByValue, hasParameterErrors]);

    const filteredNodes = useMemo(() => {
        let searchString = filterText.trim().toLocaleLowerCase();
        const nodeMatchesSearchString = ({label, value}) => (
            label.toLocaleLowerCase().indexOf(searchString) > -1 ||
            value.toLocaleLowerCase().indexOf(searchString) > -1
        );

        const filterNodes = (filtered, node) => {
            if (nodeMatchesSearchString(node)) {
                filtered.push(node);
            } else {
                const filteredChildren = (node.children || []).reduce(filterNodes, []);

                if (filteredChildren.length > 0) {
                    filtered.push({...node, children: filteredChildren});
                }
            }

            return filtered;
        };

        if (!filterText) {
            return nodes;
        }

        return nodes.reduce(filterNodes, []);
    }, [filterText, nodes]);

    const pendingNode = pendingPartValue ? nodeByValue.get(pendingPartValue) : null;

    const handleRefresh = () => {
        return new Promise((resolve, reject) => {
            // Intercept with a confirmation prompt
            const shouldRefresh = window.confirm("Ви впевнені, що хочете оновити? Незбережені зміни будуть втрачені!");

            if (shouldRefresh) {
                // Run your data fetching logic
                resolve();
                window.location = window.location.origin;
            } else {
                // Cancel the refresh animation immediately
                reject();
            }
        });
    };

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="filter-container">
                <Grid container spacing={1}
                      sx={{height: '100%', flexDirection: 'column', flexWrap: 'nowrap', minHeight: 0}}>
                    {vehiclesLoading && (
                        <Grid size={12}>
                            <CircularProgress size={24} aria-label="Завантаження автомобілів"/>
                        </Grid>
                    )}
                    {vehiclesError && !isErrorDismissed && (
                        <Grid size={12}>
                            <Alert severity="error" onClose={() => setIsErrorDismissed(true)}>{vehiclesError}</Alert>
                        </Grid>
                    )}
                    <Accordion color="primary" sx={{'&.Mui-expanded': {margin: 0}}}>
                        <AccordionSummary
                            color="primary"
                            expandIcon={<ArrowCircleDown/>}
                            aria-controls={`panel1-content`}
                            id={`panel1-header`}
                        >
                            <Typography component="span">Службова інформація</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <VehicleParametersBar
                                vehicles={vehicles}
                                vehicle={selectedVehicle}
                                onVehicleChange={onVehicleChange}
                                orderNumber={orderNumber}
                                orderNumberOptions={orderNumberOptions}
                                onOrderNumberChange={onOrderNumberChange}
                                chassisNumber={chassisNumber}
                                onChassisNumberChange={(e) => setChassisNumber(e.target.value)}
                                engineNumber={engineNumber}
                                onEngineNumberChange={(e) => setEngineNumber(e.target.value)}
                                parameterErrors={showParameterValidation ? parameterErrors : {}}
                            />
                            <Grid size={12} id={"filter-grid"}>
                                <PartsFilter
                                    filterText={filterText}
                                    onFilterChange={onFilterChange}
                                    onFilterTextChange={setFilterText}
                                    onClear={() => setFilterText('')}
                                />
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    <Grid container size={12} spacing={1}
                          sx={{flex: 1, minHeight: 0, flexWrap: 'nowrap', position: 'relative'}}>
                        <Grid size={8} sx={{display: 'flex', minWidth: 0, position: 'relative', padding: 0}}
                              className="parts-tree-container">
                            <PartsTree
                                nodes={filteredNodes}
                                checked={checked}
                                expanded={expanded}
                                onCheck={onCheck}
                                onExpand={onExpand}
                            />
                        </Grid>
                        <Grid size={4} id={"selected-grid"} sx={{display: 'flex', minWidth: 0}}>
                            <SelectedPartsList
                                checked={checked}
                                nodeByValue={nodeByValue}
                                itemFlags={itemFlags}
                                filterText={filterText}
                                onSelectedItemToggle={onSelectedItemToggle}
                                onEditItem={handleEditItem}
                                onAddItem={() => setNewPartDialogOpen(true)}
                                onSubmit={onSubmit}
                                isSubmitting={isSubmitting}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <VehicleChangeConfirmDialog
                    open={vehicleChangeDialogOpen}
                    onCancel={handleVehicleChangeCancel}
                    onConfirm={handleVehicleChangeConfirm}
                    selectedCount={checked.length}
                    nextVehicle={pendingVehicle}
                />
                {partDialogOpen && (
                    <PartDetailsDialog
                        open
                        partLabel={pendingNode?.selectionLabel ?? pendingNode?.label ?? ''}
                        partValue={pendingPartValue ?? ''}
                        isValueEditable={pendingNode?.editable === true}
                        maxQuantity={getNodeQuantity(pendingNode)}
                        initialValues={isEditingExistingPart && pendingPartValue ? itemFlags[pendingPartValue] : undefined}
                        onApply={handlePartDialogApply}
                        onCancel={handlePartDialogCancel}
                    />
                )}
                {newPartDialogOpen && (
                    <NewPartDialog
                        open
                        onApply={handleNewPartApply}
                        onCancel={() => setNewPartDialogOpen(false)}
                    />
                )}
                <RestoreOrderDialog
                    open={restoreDialogOpen}
                    orderNumber={orderNumber}
                    selectedCount={savedOrderData?.checked?.length ?? 0}
                    onRestore={handleRestoreOrder}
                    onDiscard={handleDiscardRestore}
                />
                <Snackbar
                    open={Boolean(submitNotification)}
                    autoHideDuration={5000}
                    onClose={() => setSubmitNotification(null)}
                    anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                >
                    <Alert severity={submitNotification?.severity} variant="filled"
                           onClose={() => setSubmitNotification(null)}>
                        {submitNotification?.message}
                    </Alert>
                </Snackbar>
            </div>
        </PullToRefresh>
    );
}

export default VehicleRepairComponent;
