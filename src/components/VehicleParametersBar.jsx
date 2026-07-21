import {Autocomplete, createFilterOptions, Grid, MenuItem, TextField} from "@mui/material";
import {useState} from "react";
import FormControl from "@mui/material/FormControl";
import {FormHelperText, InputLabel, Paper, Select, styled} from "@mui/material";

const Item = styled(Paper)(({theme}) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

const orderNumberFilter = createFilterOptions();

function VehicleParametersBar({vehicles, vehicle, onVehicleChange, orderNumber, orderNumberOptions = [], onOrderNumberChange, chassisNumber, onChassisNumberChange, engineNumber, onEngineNumberChange, parameterErrors = {}}) {
    const [addedOrderNumberOptions, setAddedOrderNumberOptions] = useState([]);
    const availableOrderNumberOptions = [...new Set([...orderNumberOptions, ...addedOrderNumberOptions])];

    const handleOrderNumberChange = (_, newValue) => {
        const value = typeof newValue === 'string'
            ? newValue
            : newValue?.inputValue ?? newValue ?? '';

        if (newValue?.inputValue) {
            setAddedOrderNumberOptions((current) => [...new Set([...current, value])]);
        }

        onOrderNumberChange({target: {value}});
    };

    return (
        <Grid container size={12} spacing={1} id={"parameters-grid"}>
            <Grid size={3}>
                <Item>
                    <FormControl fullWidth error={Boolean(parameterErrors.vehicle)}>
                        <InputLabel>Авто</InputLabel>
                        <Select
                            labelId="vehicle-select-label"
                            id="vehicle-select"
                            label="vehicle"
                            value={vehicle}
                            onChange={onVehicleChange}
                            variant={'outlined'}>
                            {vehicles.map((vehicleItem) => (
                                <MenuItem key={vehicleItem.value} value={vehicleItem.value}>
                                    {vehicleItem.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {parameterErrors.vehicle && <FormHelperText>Оберіть автомобіль</FormHelperText>}
                    </FormControl>
                </Item>
            </Grid>
            <Grid size={3}>
                <Item>
                    <Autocomplete
                        id="order-number-input"
                        fullWidth
                        value={orderNumber}
                        freeSolo
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        options={availableOrderNumberOptions}
                        onInputChange={(_, value) => onOrderNumberChange({target: {value}})}
                        onChange={handleOrderNumberChange}
                        filterOptions={(options, params) => {
                            const filtered = orderNumberFilter(options, params);
                            const inputValue = params.inputValue.trim();

                            if (inputValue && !options.includes(inputValue)) {
                                filtered.push({inputValue, label: `Додати «${inputValue}»`});
                            }

                            return filtered;
                        }}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.label ?? option.inputValue}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Номер замовлення"
                                error={Boolean(parameterErrors.orderNumber)}
                                helperText={parameterErrors.orderNumber ? 'Вкажіть номер замовлення' : ''}
                            />
                        )}
                    />
                </Item>
            </Grid>
            <Grid size={3}>
                <Item>
                    <TextField
                        id="chassis-number-input"
                        label="Номер шасі"
                        variant="outlined"
                        color="primary"
                        fullWidth
                        value={chassisNumber}
                        onChange={onChassisNumberChange}
                        error={Boolean(parameterErrors.chassisNumber)}
                        helperText={parameterErrors.chassisNumber ? 'Вкажіть номер шасі' : ''}
                    />
                </Item>
            </Grid>
            <Grid size={3}>
                <Item>
                    <TextField
                        id="engine-number-input"
                        label="Номер двигуна"
                        variant="outlined"
                        color="primary"
                        fullWidth
                        value={engineNumber}
                        onChange={onEngineNumberChange}
                        error={Boolean(parameterErrors.engineNumber)}
                        helperText={parameterErrors.engineNumber ? 'Вкажіть номер двигуна' : ''}
                    />
                </Item>
            </Grid>
        </Grid>
    );
}

export default VehicleParametersBar;
