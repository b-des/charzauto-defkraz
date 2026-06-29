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
    Typography
} from "@mui/material";
import Button from "@mui/material/Button";
import {Edit} from "@mui/icons-material";

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

function SelectedPartsList({checked, nodeByValue, itemFlags, filterText, onSelectedItemToggle, onEditItem, onSubmit}) {
    const filteredChecked = filterText
        ? checked.filter((value) => {
            const node = nodeByValue.get(value);
            const label = node?.label ?? value.split('#')[0];
            return label.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1;
        })
        : checked;

    return (
        <Item>
            <Typography variant="subtitle1" component="h3">
                Вибрано: {checked.length} деталей
                {filterText && filteredChecked.length !== checked.length && ` (показано: ${filteredChecked.length})`}
            </Typography>
            <List sx={{width: '100%', bgcolor: 'background.paper'}}>
                {filteredChecked.map((value) => {
                    const labelId = `checkbox-list-label-${value}`;
                    const node = nodeByValue.get(value);
                    const label = node?.label ?? value.split('#')[0];
                    const flags = itemFlags[value] ?? {replace: 0, repair: 0, missing: 0};

                    return (
                        <ListItem
                            key={value}
                            disablePadding
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                py: 0.75,
                            }}
                        >
                            <Checkbox
                                onClick={() => onSelectedItemToggle(value)}
                                edge="start"
                                checked={true}
                                tabIndex={-1}
                                disableRipple
                                slotProps={{input: {'aria-labelledby': labelId}}}
                                sx={{alignSelf: 'center'}}
                            />
                            <ListItemText
                                id={labelId}
                                primary={label}
                                secondary={value.split('#')[0]}
                                sx={{flex: 1, my: 0}}
                                primaryTypographyProps={{lineHeight: 1.3}}
                                secondaryTypographyProps={{lineHeight: 1.3}}
                            />
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{flexShrink: 0, alignSelf: 'center'}}
                            >
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
            <Button variant="contained" color="primary" onClick={onSubmit}>
                Відправити
            </Button>
        </Item>
    );
}

export default SelectedPartsList;
