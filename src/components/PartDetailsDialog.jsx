import {useState, useEffect} from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import NumberSpinner from "./NumberSpinner.jsx";
import {getBasePartValue, getSizeChoices} from "../utils/partValue.js";

function PartDetailsDialog({
                               open,
                               partLabel,
                               partValue,
                               isValueEditable,
                               isMultiChoice,
                               sizeItems,
                               maxQuantity,
                               initialValues,
                               onApply,
                               onCancel
                           }) {
    const [replace, setReplace] = useState(0);
    const [repair, setRepair] = useState(0);
    const [missing, setMissing] = useState(0);
    const [value, setValue] = useState('');
    const [sizeValue, setSizeValue] = useState('');
    const sizeChoices = getSizeChoices({multichoice: isMultiChoice, sizeItems});
    const requiresSizeChoice = sizeChoices.length > 0;
    const hasValidSizeChoice = sizeChoices.some((item) => item.value === sizeValue);

    useEffect(() => {
        if (open) {
            setReplace(initialValues?.replace ?? 0);
            setRepair(initialValues?.repair ?? 0);
            setMissing(initialValues?.missing ?? 0);
            setValue(initialValues?.value ?? partValue?.split('#')[0] ?? '');
            setSizeValue(String(initialValues?.sizeValue ?? ''));
        }
    }, [open, initialValues, partValue]);

    const total = replace + repair + missing;
    const remaining = maxQuantity - total;
    const isValid = total > 0
        && total <= maxQuantity
        && (!isValueEditable || value.trim().length > 0)
        && (!requiresSizeChoice || hasValidSizeChoice);

    const handleApply = () => {
        onApply({
            replace,
            repair,
            missing,
            ...(isValueEditable && {value: value.trim()}),
            ...(requiresSizeChoice && {sizeValue}),
        });
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle sx={{color: '#000'}}>Деталізація</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{mb: 0.5}}>{partLabel}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    {partValue?.split('#')[0]} &middot; Кількість на авто: {maxQuantity}
                </Typography>

                <Stack spacing={2}>
                    {requiresSizeChoice && (
                        <FormControl fullWidth size="small" required error={!hasValidSizeChoice}>
                            <InputLabel id="part-size-label">Розмір</InputLabel>
                            <Select
                                labelId="part-size-label"
                                label="Розмір"
                                value={sizeValue}
                                onChange={(event) => setSizeValue(event.target.value)}
                                autoFocus
                            >
                                {sizeChoices.map((item, index) => (
                                    <MenuItem key={`${item.value}-${index}`} value={item.value}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {!hasValidSizeChoice && <FormHelperText>Оберіть один розмір</FormHelperText>}
                            {hasValidSizeChoice && (
                                <FormHelperText>
                                    Підсумкове значення: {sizeValue}{getBasePartValue(partValue)}
                                </FormHelperText>
                            )}
                        </FormControl>
                    )}
                    {isValueEditable && (
                        <TextField
                            label="Значення"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            error={!value.trim()}
                            helperText={!value.trim() ? 'Вкажіть значення деталі' : ' '}
                            size="small"
                            fullWidth
                            autoFocus={!requiresSizeChoice}
                        />
                    )}
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>На заміну</Typography>
                        <NumberSpinner
                            min={0}
                            max={maxQuantity}
                            size="small"
                            value={replace}
                            onValueChange={(v) => setReplace(v ?? 0)}
                            onValueCommitted={(v) => setReplace(v ?? 0)}
                        />
                    </Stack>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>На ремонт</Typography>
                        <NumberSpinner
                            min={0}
                            max={maxQuantity}
                            size="small"
                            value={repair}
                            onValueChange={(v) => setRepair(v ?? 0)}
                            onValueCommitted={(v) => setRepair(v ?? 0)}
                        />
                    </Stack>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="body2" sx={{width: 100, flexShrink: 0}}>Відсутні</Typography>
                        <NumberSpinner
                            min={0}
                            max={maxQuantity}
                            size="small"
                            value={missing}
                            onValueChange={(v) => setMissing(v ?? 0)}
                            onValueCommitted={(v) => setMissing(v ?? 0)}
                        />
                    </Stack>
                </Stack>

                <Typography
                    variant="body2"
                    sx={{mt: 2}}
                    color={remaining < 0 ? 'error' : 'text.secondary'}
                >
                    Залишок у робочому стані: {remaining < 0 ? 0 : remaining} з {maxQuantity}
                    {remaining < 0 && ' (перевищено!)'}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">Скасувати</Button>
                <Button onClick={handleApply} variant="contained" disabled={!isValid}>
                    Застосувати
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PartDetailsDialog;
