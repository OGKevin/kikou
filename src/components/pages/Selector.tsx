import React, { useState, useMemo, forwardRef, HTMLAttributes } from "react";
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  Autocomplete,
  AutocompleteOption,
  ListItemDecorator,
  ListItemContent,
  AspectRatio,
  Skeleton,
  Divider,
} from "@mui/joy";
import { List } from "react-window";
import { useArchiveContext } from "@/contexts/ArchiveContext";

interface PageSelectorProps {
  selectedIndex: number;
  onPageIndexChange: (index: number) => void;
  imageFiles: string[];
  targetFile: string | null;
}

interface PageOption {
  index: number;
  label: string;
  fileName: string;
}

const PreviewImage = React.memo(({ fileName }: { fileName: string }) => {
  const ctx = useArchiveContext();
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const previewUrl = ctx ? ctx.previewCache.current[fileName] : undefined;

  React.useEffect(() => {
    if (previewUrl) {
      setImageLoaded(false);
    }
  }, [previewUrl]);

  if (!ctx) {
    return (
      <AspectRatio ratio="1" sx={{ width: 40, minWidth: 40 }}>
        <Skeleton loading />
      </AspectRatio>
    );
  }

  const isLoading = !previewUrl && !imageLoaded;

  return (
    <AspectRatio
      ratio="1"
      sx={{ width: 40, minWidth: 40, borderRadius: "sm" }}
      variant="plain"
      objectFit="contain"
    >
      <Skeleton loading={isLoading}>
        {previewUrl ? (
          <img
            loading="lazy"
            src={previewUrl}
            alt=""
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        ) : (
          <Box sx={{ backgroundColor: "neutral.200" }} />
        )}
      </Skeleton>
    </AspectRatio>
  );
});

PreviewImage.displayName = "PreviewImage";

const LISTBOX_PADDING = 8;
const ITEM_HEIGHT = 56;
const EMPTY_ROW_PROPS = {};

interface ListboxComponentProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const ListboxComponent = forwardRef<HTMLDivElement, ListboxComponentProps>(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = React.Children.toArray(children);
    const itemCount = itemData.length;
    const rowProps = React.useMemo(() => EMPTY_ROW_PROPS, []);

    return (
      <div ref={ref} {...other}>
        <List
          defaultHeight={
            Math.min(8, itemCount) * ITEM_HEIGHT + 2 * LISTBOX_PADDING
          }
          rowHeight={ITEM_HEIGHT}
          rowCount={itemCount}
          overscanCount={5}
          rowProps={rowProps}
          rowComponent={({ index, style }) => {
            const child = itemData[index];

            return <div style={style}>{child}</div>;
          }}
          style={{
            padding: `${LISTBOX_PADDING}px 0`,
          }}
        />
      </div>
    );
  },
);

export default function VirtualizedPageSelector({
  selectedIndex,
  onPageIndexChange,
  imageFiles,
  targetFile,
}: PageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options: PageOption[] = useMemo(
    () =>
      imageFiles.map((fileName, index) => ({
        index,
        label: `${index + 1}`,
        fileName,
      })),
    [imageFiles],
  );

  const selectedOption =
    selectedIndex >= 0 && selectedIndex < options.length
      ? options[selectedIndex]
      : null;

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
      }}
    >
      <FormControl sx={{ width: "100%", maxWidth: 500 }}>
        <FormLabel sx={{ fontSize: "lg", fontWeight: "bold" }}>
          Select Page:
        </FormLabel>
        <Autocomplete
          placeholder="Choose a page..."
          slotProps={{
            input: {
              autoComplete: "new-password",
            },
            listbox: {
              component: ListboxComponent,
            },
          }}
          options={options}
          value={selectedOption}
          open={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          onChange={(_, newValue) => {
            if (newValue) {
              onPageIndexChange(newValue.index);
            }
          }}
          autoHighlight
          getOptionLabel={(option) => `${option.label} - ${option.fileName}`}
          isOptionEqualToValue={(option, value) => option.index === value.index}
          renderOption={(props, option) => (
            <AutocompleteOption {...props}>
              <ListItemDecorator>
                <PreviewImage fileName={option.fileName} />
              </ListItemDecorator>
              <Divider orientation="vertical" />
              <ListItemContent sx={{ fontSize: "sm" }}>
                {option.label}
                <Typography level="body-xs">{option.fileName}</Typography>
              </ListItemContent>
            </AutocompleteOption>
          )}
        />
      </FormControl>

      <Typography level="body-sm" color="neutral">
        {`Total pages: ${imageFiles.length}${
          targetFile ? ` | Selected: ${targetFile}` : ""
        }`}
      </Typography>
    </Box>
  );
}
