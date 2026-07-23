import {useState, useCallback, useMemo, useRef} from 'react';

import '@fortawesome/fontawesome-free/css/all.css';
import {Alert, CircularProgress, Grid, Snackbar} from "@mui/material";
import VehicleParametersBar from "./components/VehicleParametersBar.jsx";
import PartsFilter from "./components/PartsFilter.jsx";
import PartsTree from "./components/PartsTree.jsx";
import SelectedPartsList from "./components/SelectedPartsList.jsx";
import VehicleChangeConfirmDialog from "./components/VehicleChangeConfirmDialog.jsx";
import PartDetailsDialog from "./components/PartDetailsDialog.jsx";
import RestoreOrderDialog from "./components/RestoreOrderDialog.jsx";
import {useVehicles} from "./hooks/useVehicles.js";
import {sendDefect} from "./api/orderApi.js";

const STORAGE_KEY_PREFIX = 'defkraz_order_';
const DRAFT_STORAGE_KEY = `${STORAGE_KEY_PREFIX}draft`;


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

    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [savedOrderData, setSavedOrderData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitNotification, setSubmitNotification] = useState(null);
    const [showParameterValidation, setShowParameterValidation] = useState(false);
    const orderNumberDebounceRef = useRef(null);

    const selectedVehicle = vehicle || vehicles[0]?.value || '';
    const parameterErrors = {
        vehicle: !selectedVehicle.trim(),
        orderNumber: !orderNumber.trim(),
        chassisNumber: !chassisNumber.trim(),
        engineNumber: !engineNumber.trim(),
    };
    const hasParameterErrors = Object.values(parameterErrors).some(Boolean);
    const nodes = useMemo(() => vehicles.find((item) => item.value === selectedVehicle)?.nodes ?? [], [vehicles, selectedVehicle]);
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
    }, [checked.length]);

    const clearSelectionState = useCallback(() => {
        setChecked([]);
        setExpanded([]);
        setItemFlags({});
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
            setPendingPartValue(newValues[0]);
            setIsEditingExistingPart(false);
            setPartDialogOpen(true);
            setChecked(checkedValues);
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
    }, [checked]);

    const onSelectedItemToggle = useCallback((value) => {
        setChecked((current) => current.filter(v => v !== value));
        setItemFlags((current) => {
            const next = {...current};
            delete next[value];
            return next;
        });
    }, []);

    const handlePartDialogApply = useCallback((values) => {
        setItemFlags((current) => ({
            ...current,
            [pendingPartValue]: {replace: values.replace, repair: values.repair, missing: values.missing}
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
            setVehicle(savedOrderData.vehicle);
            setChecked(savedOrderData.checked);
            setItemFlags(savedOrderData.itemFlags);
            setChassisNumber(savedOrderData.chassisNumber ?? '');
            setEngineNumber(savedOrderData.engineNumber ?? '');
        }
        setRestoreDialogOpen(false);
        setSavedOrderData(null);
    }, [savedOrderData]);

    const handleDiscardRestore = useCallback(() => {
        setRestoreDialogOpen(false);
        setSavedOrderData(null);
    }, []);

    const onFilterChange = useCallback((e) => {
        setFilterText(e.target.value);
    }, []);

    const onSubmit = useCallback(async () => {
        const selectedItems = checked.map((value) => {
            const node = nodeByValue.get(value);
            const flags = itemFlags[value] ?? {replace: 0, repair: 0, missing: 0};

            return {
                "value": value.split('#')[0],
                label: node?.label ?? value.split('#')[0],
                quantity: getNodeQuantity(node),
                replace: flags.replace,
                repair: flags.repair,
                missing: flags.missing,
            };
        });

        const stateToSave = {
            vehicle: selectedVehicle,
            checked,
            itemFlags,
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
    }, [checked, orderNumber, selectedVehicle, chassisNumber, engineNumber, itemFlags, nodeByValue, hasParameterErrors]);

    const filteredNodes = useMemo(() => {
        const nodeMatchesSearchString = ({label}) => (
            label.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1
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

    return (
        <div className="filter-container">
            <Grid container spacing={1}>
                {vehiclesLoading && (
                    <Grid size={12}>
                        <CircularProgress size={24} aria-label="Завантаження автомобілів"/>
                    </Grid>
                )}
                {vehiclesError && (
                    <Grid size={12}>
                        <Alert severity="error" onClose={() => {}}>{vehiclesError}</Alert>
                    </Grid>
                )}
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
                        onClear={() => setFilterText('')}
                    />
                </Grid>
                <Grid size={8}>
                    <PartsTree
                        nodes={filteredNodes}
                        checked={checked}
                        expanded={expanded}
                        onCheck={onCheck}
                        onExpand={onExpand}
                    />
                </Grid>
                <Grid size={4} id={"selected-grid"}>
                    <SelectedPartsList
                        checked={checked}
                        nodeByValue={nodeByValue}
                        itemFlags={itemFlags}
                        filterText={filterText}
                        onSelectedItemToggle={onSelectedItemToggle}
                        onEditItem={handleEditItem}
                        onSubmit={onSubmit}
                        isSubmitting={isSubmitting}
                    />
                </Grid>
            </Grid>
            <VehicleChangeConfirmDialog
                open={vehicleChangeDialogOpen}
                onCancel={handleVehicleChangeCancel}
                onConfirm={handleVehicleChangeConfirm}
                selectedCount={checked.length}
                nextVehicle={pendingVehicle}
            />
            <PartDetailsDialog
                open={partDialogOpen}
                partLabel={pendingNode?.label ?? ''}
                partValue={pendingPartValue ?? ''}
                maxQuantity={getNodeQuantity(pendingNode)}
                initialValues={isEditingExistingPart && pendingPartValue ? itemFlags[pendingPartValue] : undefined}
                onApply={handlePartDialogApply}
                onCancel={handlePartDialogCancel}
            />
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
    );
}

export default VehicleRepairComponent;
