import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

function VehicleChangeConfirmDialog({
    open,
    onCancel,
    onConfirm,
    selectedCount,
    nextVehicle,
}) {
    return (
        <Dialog open={open} onClose={onCancel} aria-labelledby="vehicle-change-dialog-title">
            <DialogTitle id="vehicle-change-dialog-title" color="warning">
                Підтвердьте зміну авто
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {selectedCount > 0
                        ? `Зміна авто очистить ${selectedCount} вибраних елементів. Змінити на ${nextVehicle}?`
                        : 'Зміна авто без вибраних елементів.'}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">
                    Скасувати
                </Button>
                <Button onClick={onConfirm} variant="contained" color="primary" autoFocus>
                    Продовжити
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default VehicleChangeConfirmDialog;
