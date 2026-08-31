import {
    Checkbox,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    styled,
    Typography,
    alpha
} from "@mui/material";
import Button from "@mui/material/Button";
import {Add, Edit} from "@mui/icons-material";
import {confirmable, createConfirmation} from "react-confirm";
import ConfirmationDialog from "./ConfirmationDialog.jsx";
import {getFinalPartValue} from "../utils/partValue.js";

const showDeleteConfirmation = createConfirmation(confirmable(ConfirmationDialog));

const Item = styled(Paper)(({theme}) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    width: '100%',
    height: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

function SelectedPartsList({
                               checked,
                               nodeByValue,
                               itemFlags,
                               filterText,
                               onSelectedItemToggle,
                               onEditItem,
                               onAddItem,
                               onSubmit,
                               isSubmitting
                           }) {
    const filteredChecked = filterText
        ? checked.filter((value) => {
            const node = nodeByValue.get(value);
            const label = node?.selectionLabel ?? node?.label ?? value.split('#')[0];
            const displayedValue = getFinalPartValue(node, value, itemFlags[value]);
            const searchableText = `${label} ${displayedValue}`.toLocaleLowerCase();

            return searchableText.indexOf(filterText.toLocaleLowerCase()) > -1;
        })
        : checked;

    const handleDelete = (value) => {
        showDeleteConfirmation({
            title: 'Підтвердіть дію',
            description: 'Видалити елемент зі списку?',
        }).then(confirmed => {
            if (confirmed) {
                onSelectedItemToggle(value);
            }
        });
    };

    return (
        <Item>
            <Typography variant="subtitle1" component="h3">
                Вибрано: {checked.length} деталей
                {filterText && filteredChecked.length !== checked.length && ` (показано: ${filteredChecked.length})`}
            </Typography>
            <Button startIcon={<Add/>} onClick={onAddItem} sx={{alignSelf: 'flex-start'}}>
                Додати деталь
            </Button>
            <List sx={{width: '100%', flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'background.paper'}}>
                {filteredChecked.map((value) => {
                    const labelId = `checkbox-list-label-${value}`;
                    const node = nodeByValue.get(value);
                    const label = node?.selectionLabel ?? node?.label ?? value.split('#')[0];
                    const flags = itemFlags[value] ?? {replace: 0, repair: 0, missing: 0};
                    const displayedValue = getFinalPartValue(node, value, flags);
                    const isManual = node?.isCustom || value.includes('#custom-');

                    return (
                        <ListItem
                            key={value}
                            disablePadding
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                py: 0.75,
                                px: 0.5,
                                borderRadius: 1,
                                backgroundColor: (theme) => isManual
                                    ? alpha(theme.palette.warning.main, 0.12)
                                    : 'transparent',
                            }}>
                            <Checkbox
                                onClick={() => handleDelete(value)}
                                edge="start"
                                checked={true}
                                tabIndex={-1}
                                disableRipple
                                slotProps={{input: {'aria-labelledby': labelId}}}
                                sx={{alignSelf: 'center'}}/>
                            <ListItemText
                                id={labelId}
                                primary={label}
                                secondary={displayedValue}
                                sx={{flex: 1, my: 0}}
                                primaryTypographyProps={{lineHeight: 1.3}}
                                secondaryTypographyProps={{lineHeight: 1.3}}/>
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{flexShrink: 0, alignSelf: 'center'}}>
                                {isManual && (
                                    <Chip label="Додано вручну" size="small" color="warning" variant="outlined"/>
                                )}
                                {flags.replace > 0 && (
                                    <Chip label={`З: ${flags.replace}`} size="small" color="error"/>
                                )}
                                {flags.repair > 0 && (
                                    <Chip label={`Р: ${flags.repair}`} size="small" color="warning"/>
                                )}
                                {flags.missing > 0 && (
                                    <Chip label={`В: ${flags.missing}`} size="small"/>
                                )}
                                <IconButton size="small" onClick={() => onEditItem(value)}>
                                    <Edit fontSize="small"/>
                                </IconButton>
                            </Stack>
                        </ListItem>
                    );
                })}
            </List>
            <Button variant="contained" color="primary" onClick={onSubmit} disabled={isSubmitting || checked.length === 0}>
                {isSubmitting ? 'Відправлення…' : 'Відправити'}
            </Button>
        </Item>
    );
}

export default SelectedPartsList;
