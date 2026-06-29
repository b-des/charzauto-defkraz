import {Grid, MenuItem, TextField} from "@mui/material";
import FormControl from "@mui/material/FormControl";
import {InputLabel, Paper, Select, styled} from "@mui/material";

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

function VehicleParametersBar({vehicles, vehicle, onVehicleChange, orderNumber, onOrderNumberChange, chassisNumber, onChassisNumberChange, engineNumber, onEngineNumberChange}) {
    return (
        <Grid container size={12} spacing={1} id={"parameters-grid"}>
            <Grid size={3}>
                <Item>
                    <FormControl fullWidth>
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
                    </FormControl>
                </Item>
            </Grid>
            <Grid size={3}>
                <Item>
                    <TextField
                        id="order-number-input"
                        label="Номер замовлення"
                        variant="outlined"
                        color="primary"
                        fullWidth
                        value={orderNumber}
                        onChange={onOrderNumberChange}
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
                    />
                </Item>
            </Grid>
        </Grid>
    );
}

export default VehicleParametersBar;
