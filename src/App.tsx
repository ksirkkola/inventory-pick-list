import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Center,
  Container,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { Activity } from '@hailer/app-sdk';
import { useApp } from './hailer/use-app';
import { listAll, firstFileId, imageUrl } from './hailer/api-helpers';
import { INVENTORY } from './constants/schema';
import { HailerSearch } from './hailer/theme/icons/HailerSearch';
import { HailerDocImage } from './hailer/theme/icons/HailerDocImage';
import { HailerPin } from './hailer/theme/icons/HailerPin';

interface Item {
  _id: string;
  name: string;
  sku: string;
  photoFileId?: string;
  binLocation?: string;
  quantityOnHand?: number;
  minimumStock?: number;
  description?: string;
  supplier?: string;
}

function mapItem(a: Activity): Item {
  const f = a.fields ?? {};
  return {
    _id: a._id,
    name: a.name,
    sku: (f[INVENTORY.fields.sku] as string) || '',
    photoFileId: firstFileId(f[INVENTORY.fields.photo]),
    binLocation: f[INVENTORY.fields.binLocation] as string | undefined,
    quantityOnHand: f[INVENTORY.fields.quantityOnHand] as number | undefined,
    minimumStock: f[INVENTORY.fields.minimumStock] as number | undefined,
    description: f[INVENTORY.fields.productDescription] as string | undefined,
    supplier: f[INVENTORY.fields.supplier] as string | undefined,
  };
}

function ItemCard({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const photoBg = useColorModeValue('gray.50', 'gray.800');
  const lowStock =
    item.minimumStock != null &&
    item.minimumStock > 0 &&
    (item.quantityOnHand ?? 0) <= item.minimumStock;

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.15s ease"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      onClick={onOpen}
    >
      <Center bg={photoBg} h="160px">
        {item.photoFileId ? (
          <Image
            src={imageUrl(item.photoFileId, 'hires')}
            alt={item.name}
            objectFit="contain"
            maxH="100%"
            maxW="100%"
          />
        ) : (
          <Icon as={HailerDocImage} boxSize={10} color="gray.300" />
        )}
      </Center>
      <Box p={3}>
        <HStack justify="space-between" align="start" mb={1}>
          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{item.sku || '—'}</Text>
          {item.binLocation && (
            <Badge colorScheme="blue" fontSize="2xs" display="flex" alignItems="center" gap={1}>
              <Icon as={HailerPin} boxSize={2.5} />
              {item.binLocation}
            </Badge>
          )}
        </HStack>
        <Text fontSize="sm" noOfLines={2} color="subtleText" minH="2.5em">
          {item.description || item.name}
        </Text>
        <HStack justify="space-between" mt={2}>
          <Text fontSize="xs" color="subtleText">
            Qty on hand: <Text as="span" fontWeight="bold" color={lowStock ? 'red.400' : undefined}>
              {item.quantityOnHand ?? '—'}
            </Text>
          </Text>
          {lowStock && (
            <Badge colorScheme="red" fontSize="2xs">LOW STOCK</Badge>
          )}
        </HStack>
      </Box>
    </Box>
  );
}

export default function App() {
  const { hailer, api, inside, settings } = useApp();
  const { setColorMode } = useColorMode();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void api.init();
  }, [api]);

  useEffect(() => {
    if (settings) setColorMode(settings.theme === 'dark' ? 'dark' : 'light');
  }, [settings, setColorMode]);

  useEffect(() => {
    if (!inside || !hailer) return;
    let cancelled = false;
    listAll(hailer, INVENTORY.workflowId, INVENTORY.phaseId)
      .then((rows) => {
        if (cancelled) return;
        setItems(
          rows
            .map(mapItem)
            .sort((a, b) => a.sku.localeCompare(b.sku)),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as { msg?: string; message?: string };
        setError(e?.msg || e?.message || String(err));
      });
    return () => { cancelled = true; };
  }, [inside, hailer]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.sku, i.name, i.description, i.binLocation, i.supplier]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }, [items, search]);

  if (inside === null) {
    return (
      <Box margin="2em">
        <Heading fontSize="lg" color="subtleText">Connecting to Hailer…</Heading>
      </Box>
    );
  }

  if (inside === false) {
    return (
      <Box margin="2em">
        <Heading fontSize="lg" color="subtleText">You are outside of Hailer</Heading>
        <Text>This app must be loaded inside Hailer.</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box margin="2em">
        <Heading fontSize="lg" color="red.400" mb={2}>Failed to load inventory</Heading>
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Heading
        fontSize="xl"
        bgGradient="linear(to-r, blue.400, purple.400)"
        bgClip="text"
        fontWeight="extrabold"
        mb={4}
      >
        Inventory Pick List
      </Heading>

      <InputGroup mb={5} size="lg">
        <InputLeftElement pointerEvents="none">
          <Icon as={HailerSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search by SKU, name, bin location, supplier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </InputGroup>

      {items === null ? (
        <HStack>
          <Spinner size="sm" />
          <Text color="subtleText">Loading inventory…</Text>
        </HStack>
      ) : filtered.length === 0 ? (
        <VStack py={16} color="subtleText">
          <Icon as={HailerSearch} boxSize={8} />
          <Text>No items match your search.</Text>
        </VStack>
      ) : (
        <>
          <Text fontSize="sm" color="subtleText" mb={3}>
            {filtered.length} item{filtered.length === 1 ? '' : 's'}
          </Text>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={4}>
            {filtered.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onOpen={() => hailer && void hailer.ui.activity.open(item._id)}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Container>
  );
}
