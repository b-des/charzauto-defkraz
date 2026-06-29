import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import Button from "@mui/material/Button";

function RestoreOrderDialog({open, orderNumber, selectedCount, onRestore, onDiscard}) {
    return (
        <Dialog open={open} onClose={onDiscard} maxWidth="xs" fullWidth>
            <DialogTitle sx={{color: 'text.primary'}}>Знайдено збережене замовлення</DialogTitle>
            <DialogContent>
                <Typography variant="body1">
                    Для замовлення <strong>{orderNumber}</strong> знайдено збережений стан
                    ({selectedCount} деталей).
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                    Відновити збережені дані?
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onDiscard} color="inherit">Ні, почати з нуля</Button>
                <Button onClick={onRestore} variant="contained">Відновити</Button>
            </DialogActions>
        </Dialog>
    );
}

export default RestoreOrderDialog;
