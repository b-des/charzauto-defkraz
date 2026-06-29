import {useState, useCallback, useMemo, useRef} from 'react';
import nodes255b from './assets/vehicles/kraz-255b-web.json';
import nodes255v from './assets/vehicles/kraz-255v-web.json';
import nodes260 from './assets/vehicles/kraz-260-web.json';
import nodes260v from './assets/vehicles/kraz-260v-web.json';
import nodes5233 from './assets/vehicles/kraz-5233-web.json';
import nodes6322 from './assets/vehicles/kraz-6322-web.json';
import nodes6322weichai from './assets/vehicles/kraz-6322weichai-web.json';
import nodes6446 from './assets/vehicles/kraz-6446-web.json';

import '@fortawesome/fontawesome-free/css/all.css';
import {Grid} from "@mui/material";
import VehicleParametersBar from "./components/VehicleParametersBar.jsx";
import PartsFilter from "./components/PartsFilter.jsx";
import PartsTree from "./components/PartsTree.jsx";
import SelectedPartsList from "./components/SelectedPartsList.jsx";
import VehicleChangeConfirmDialog from "./components/VehicleChangeConfirmDialog.jsx";
import PartDetailsDialog from "./components/PartDetailsDialog.jsx";
import RestoreOrderDialog from "./components/RestoreOrderDialog.jsx";

const STORAGE_KEY_PREFIX = 'defkraz_order_';


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

const vehicles = [
    {value: '255b', label: 'Краз 255 Б', nodes: nodes255b},
    {value: '255v', label: 'Краз 255 В', nodes: nodes255v},
    {value: '260', label: 'Краз 260', nodes: nodes260},
    {value: '260v', label: 'Краз 260 В', nodes: nodes260v},
    {value: '5233', label: 'Краз 5233', nodes: nodes5233},
    {value: '6322', label: 'Краз 6322', nodes: nodes6322},
    {value: '6322weichai', label: 'Краз 6322 Weichai', nodes: nodes6322weichai},
    {value: '6446', label: 'Краз 6446', nodes: nodes6446}
]

function VehicleRepairComponent() {
    const [vehicle, setVehicle] = useState(vehicles[0]['value']);
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
    const orderNumberDebounceRef = useRef(null);

    const nodes = useMemo(() => vehicles.filter(v => v.value === vehicle)[0]['nodes'], [vehicle]);
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
            } catch { /* ignore parse errors */ }
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

    const onSubmit = useCallback(() => {
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

        if (orderNumber.trim()) {
            const stateToSave = {
                vehicle,
                checked,
                itemFlags,
                chassisNumber,
                engineNumber,
            };
            try {
                localStorage.setItem(STORAGE_KEY_PREFIX + orderNumber.trim(), JSON.stringify(stateToSave));
            } catch { /* ignore quota errors */ }
        }

        console.log({selectedItems, orderNumber, engineNumber, chassisNumber});
    }, [checked, orderNumber, vehicle, chassisNumber, engineNumber, itemFlags, nodeByValue]);

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
                <VehicleParametersBar
                    vehicles={vehicles}
                    vehicle={vehicle}
                    onVehicleChange={onVehicleChange}
                    orderNumber={orderNumber}
                    onOrderNumberChange={onOrderNumberChange}
                    chassisNumber={chassisNumber}
                    onChassisNumberChange={(e) => setChassisNumber(e.target.value)}
                    engineNumber={engineNumber}
                    onEngineNumberChange={(e) => setEngineNumber(e.target.value)}
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
        </div>
    );
}

export default VehicleRepairComponent;
